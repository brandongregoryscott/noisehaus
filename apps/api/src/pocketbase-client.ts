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

const authenticate = async (): Promise<void> => {
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
    await authenticate();

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
        { method, path, status: response.status, duration: Date.now() - start },
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

const toQueryString = (options: ListOptions): string => {
    const query = new URLSearchParams();
    query.set("page", "1");
    query.set("perPage", `${options.perPage ?? DEFAULT_PER_PAGE}`);

    if (options.filter != null && options.filter !== "") {
        query.set("filter", options.filter);
    }

    if (options.sort != null && options.sort !== "") {
        query.set("sort", options.sort);
    }

    return query.toString();
};

const listRecords = async <T>(
    collection: string,
    options: ListOptions = {}
): Promise<T[]> => {
    const result = await request<ListResult<T>>(
        `/api/collections/${collection}/records?${toQueryString(options)}`,
        { method: "GET" }
    );

    return result.items;
};

const getFirstRecordByFilter = async <T>(
    collection: string,
    filter: string
): Promise<null | T> => {
    const items = await listRecords<T>(collection, {
        filter,
        perPage: 1,
    });

    return items[0] ?? null;
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
    await request("/api/health", { method: "GET" });
};

const PocketBaseClient = {
    createRecord,
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
