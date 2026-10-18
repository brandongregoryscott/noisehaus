import { isEmpty } from "lodash-es";
import {
    POCKETBASE_SUPERUSER_EMAIL,
    POCKETBASE_SUPERUSER_PASSWORD,
    POCKETBASE_URL,
} from "@/config";
import { logger } from "@/utilities/logger";

type ListResult<T> = {
    items: T[];
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
};

class PocketBaseHttpError extends Error {
    data: unknown;
    method: string;
    path: string;
    status: number;

    constructor(status: number, data: unknown, method: string, path: string) {
        super(`PocketBase request failed with status ${status}`);
        this.status = status;
        this.data = data;
        this.method = method;
        this.path = path;
    }
}

type ListOptions = {
    filter?: string;
    perPage?: number;
    sort?: string;
};

type CreateRecordBatchInput = {
    collection: string;
    data: FormData | Record<string, unknown>;
};

type BatchResult = {
    body: unknown;
    status: number;
};

type BatchErrorBody = {
    data?: {
        requests?: Record<
            string,
            {
                response?: { data: unknown; status: number };
            }
        >;
    };
};

const DEFAULT_PER_PAGE = 500;

let authToken = "";

const baseUrl = (): string => {
    const value = POCKETBASE_URL.trim();
    if (isEmpty(value)) {
        throw new Error(
            "Missing POCKETBASE_URL. Set it in apps/api/.env (e.g. http://127.0.0.1:8090)."
        );
    }

    if (!/^https?:\/\//.test(value)) {
        throw new Error(
            `Invalid POCKETBASE_URL '${value}'. It must include protocol, e.g. http://127.0.0.1:8090.`
        );
    }

    return value.replace(/\/+$/, "");
};

const parseResponseBody = async (response: Response): Promise<unknown> => {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
        return response.json();
    }

    return response.text();
};

const authenticate = async (signal?: AbortSignal): Promise<void> => {
    if (authToken !== "") {
        return;
    }

    if (isEmpty(POCKETBASE_SUPERUSER_EMAIL.trim())) {
        throw new Error(
            "Missing POCKETBASE_SUPERUSER_EMAIL. Set it in apps/api/.env."
        );
    }

    if (isEmpty(POCKETBASE_SUPERUSER_PASSWORD.trim())) {
        throw new Error(
            "Missing POCKETBASE_SUPERUSER_PASSWORD. Set it in apps/api/.env."
        );
    }

    const response = await fetch(
        `${baseUrl()}/api/collections/_superusers/auth-with-password`,
        {
            body: JSON.stringify({
                identity: POCKETBASE_SUPERUSER_EMAIL,
                password: POCKETBASE_SUPERUSER_PASSWORD,
            }),
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
            signal,
        }
    );
    const body = (await parseResponseBody(response)) as { token?: string };
    if (!response.ok || body.token == null) {
        throw new PocketBaseHttpError(
            response.status,
            body,
            "POST",
            "/api/collections/_superusers/auth-with-password"
        );
    }

    authToken = body.token;
};

const request = async <T>(
    path: string,
    options: RequestInit = {},
    allowRetry = true
): Promise<T> => {
    await authenticate(options.signal ?? undefined);

    const method = options.method ?? "GET";
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${authToken}`);

    if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    logger.debug({ method, path }, "pocketbase request");
    const start = Date.now();

    const response = await fetch(`${baseUrl()}${path}`, {
        ...options,
        headers,
    });

    const body = await parseResponseBody(response);
    if (response.ok) {
        return body as T;
    }

    logger.warn(
        { duration: Date.now() - start, method, path, status: response.status },
        "pocketbase request failed"
    );

    if (response.status === 401 && allowRetry) {
        authToken = "";
        return request<T>(path, options, false);
    }

    throw new PocketBaseHttpError(
        response.status,
        body,
        options.method ?? "GET",
        path
    );
};

const toQueryString = (options: ListOptions, page: number): string => {
    const query = new URLSearchParams();
    query.set("page", `${page}`);
    query.set("perPage", `${options.perPage ?? DEFAULT_PER_PAGE}`);

    if (options.filter != null && options.filter !== "") {
        query.set("filter", options.filter);
    }

    if (options.sort != null && options.sort !== "") {
        query.set("sort", options.sort);
    }

    return query.toString();
};

const listPage = async <T>(
    collection: string,
    options: ListOptions,
    page = 1
): Promise<ListResult<T>> =>
    request<ListResult<T>>(
        `/api/collections/${collection}/records?${toQueryString(options, page)}`,
        { method: "GET" }
    );

const listRecords = async <T>(
    collection: string,
    options: ListOptions = {}
): Promise<T[]> => {
    const records: T[] = [];
    let page = 1;
    while (true) {
        const result = await listPage<T>(collection, options, page);
        records.push(...result.items);
        if (page >= result.totalPages || result.items.length === 0) {
            return records;
        }
        page += 1;
    }
};

const getFirstRecordByFilter = async <T>(
    collection: string,
    filter: string
): Promise<null | T> => {
    const { items } = await listPage<T>(collection, {
        filter,
        perPage: 1,
    });

    return items[0] ?? null;
};

// PocketBase executes all record writes in the batch in one transaction.
// Callers provide the expected response tuple, just as single-record callers
// provide their record type to createRecord.
const createRecords = async <T extends unknown[]>(
    records: CreateRecordBatchInput[]
): Promise<T> => {
    const formData = new FormData();
    const requests = records.map(({ collection, data }, index) => {
        const body: Record<string, unknown> = {};
        if (data instanceof FormData) {
            data.forEach((value, key) => {
                if (typeof value === "string") {
                    body[key] = value;
                } else {
                    formData.append(`requests.${index}.${key}`, value);
                }
            });
        } else {
            Object.assign(body, data);
        }
        return {
            body,
            method: "POST",
            url: `/api/collections/${collection}/records`,
        };
    });
    formData.set("@jsonPayload", JSON.stringify({ requests }));

    try {
        const results = await request<BatchResult[]>("/api/batch", {
            body: formData,
            method: "POST",
        });
        return results.map((result) => result.body) as T;
    } catch (error) {
        // Preserve normal field-validation/conflict handling for batch failures.
        if (
            error instanceof PocketBaseHttpError &&
            error.data != null &&
            typeof error.data === "object"
        ) {
            const { data } = error.data as BatchErrorBody;
            const failure = Object.values(data?.requests ?? {}).find(
                (entry) => entry.response != null
            )?.response;
            if (failure != null) {
                throw new PocketBaseHttpError(
                    failure.status,
                    failure,
                    "POST",
                    "/api/batch"
                );
            }
        }
        throw error;
    }
};

const createRecord = async <T>(
    collection: string,
    data: FormData | Record<string, unknown>
): Promise<T> => {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return request<T>(`/api/collections/${collection}/records`, {
        body,
        method: "POST",
    });
};

const updateRecord = async <T>(
    collection: string,
    id: string,
    data: FormData | Record<string, unknown>
): Promise<T> => {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return request<T>(`/api/collections/${collection}/records/${id}`, {
        body,
        method: "PATCH",
    });
};

const deleteRecord = async (collection: string, id: string): Promise<void> => {
    await request(`/api/collections/${collection}/records/${id}`, {
        method: "DELETE",
    });
};

const getFileToken = async (): Promise<string> => {
    const { token } = await request<{ token: string }>("/api/files/token", {
        method: "POST",
    });
    return token;
};

const getFileUrl = (
    collection: string,
    recordId: string,
    filename: string,
    token: string
): string => {
    const query = new URLSearchParams({ token });
    return `${baseUrl()}/api/files/${collection}/${recordId}/${filename}?${query.toString()}`;
};

const escapeFilterValue = (value: string): string =>
    `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

const healthcheck = async (): Promise<void> => {
    await request("/api/health", {
        method: "GET",
        signal: AbortSignal.timeout(3000),
    });
};

const PocketBaseClient = {
    createRecord,
    createRecords,
    deleteRecord,
    escapeFilterValue,
    getFileToken,
    getFileUrl,
    getFirstRecordByFilter,
    healthcheck,
    listRecords,
    PocketBaseHttpError,
    updateRecord,
};

export { PocketBaseClient, PocketBaseHttpError };
