import type { ApiError, Result } from "common";
import { err, ErrorName, ok } from "common";
import { API_URL } from "@/utils/config";

const CONTENT_TYPE = "Content-Type";
const HEADERS = { [CONTENT_TYPE]: "application/json" };

const invalidResponse = (): ApiError => ({
    message: "The server returned an invalid response. Please try again.",
    name: ErrorName.ERROR_UNHANDLED,
});

const isApiError = (value: unknown): value is ApiError =>
    value !== null &&
    typeof value === "object" &&
    "message" in value &&
    typeof value.message === "string" &&
    "name" in value &&
    typeof value.name === "string";

const _fetch = async <T>(
    route: string,
    options?: RequestInit
): Promise<Result<T, ApiError>> => {
    let response: Response;
    try {
        response = await fetch(`${API_URL}${route}`, options);
    } catch {
        return err({
            message: "Unable to reach the server. Please try again.",
            name: ErrorName.ERROR_UNHANDLED,
        });
    }

    let body: unknown;
    try {
        body = await response.json();
    } catch {
        return err(invalidResponse());
    }
    if (
        body === null ||
        typeof body !== "object" ||
        !("error" in body) ||
        !("data" in body)
    ) {
        return err(invalidResponse());
    }
    if (isApiError(body.error)) {
        return err(body.error);
    }
    if (!response.ok || body.error !== null) {
        return err(invalidResponse());
    }
    return ok(body.data as T);
};

const get = <T>(route: string): Promise<Result<T, ApiError>> =>
    _fetch<T>(route);
const post = <TBody, T>(
    route: string,
    body: TBody
): Promise<Result<T, ApiError>> =>
    _fetch<T>(route, {
        body: JSON.stringify(body),
        headers: HEADERS,
        method: "POST",
    });
const _delete = <TBody, T>(
    route: string,
    body: TBody
): Promise<Result<T, ApiError>> =>
    _fetch<T>(route, {
        body: JSON.stringify(body),
        headers: HEADERS,
        method: "DELETE",
    });
const postMultipartForm = <T>(
    route: string,
    formData: FormData
): Promise<Result<T, ApiError>> =>
    _fetch<T>(route, { body: formData, method: "POST" });
const put = <TBody, T>(
    route: string,
    body: TBody
): Promise<Result<T, ApiError>> =>
    _fetch<T>(route, {
        body: JSON.stringify(body),
        headers: HEADERS,
        method: "PUT",
    });
const putMultipartForm = <T>(
    route: string,
    formData: FormData
): Promise<Result<T, ApiError>> =>
    _fetch<T>(route, { body: formData, method: "PUT" });

export { _delete, get, post, postMultipartForm, put, putMultipartForm };
