import { API_URL } from "@/utils/config";

const CONTENT_TYPE = "Content-Type";

const HEADERS = {
    [CONTENT_TYPE]: "application/json",
};

const _fetch = async <T>(route: string, options?: RequestInit): Promise<T> => {
    const response = (await fetch(`${API_URL}${route}`, options)).json();

    return response as T;
};

const get = async <T>(route: string): Promise<T> => _fetch(route);

const post = async <TBody, TResponse>(route: string, body: TBody) =>
    _fetch<TResponse>(route, {
        body: JSON.stringify(body),
        headers: HEADERS,
        method: "POST",
    });

const _delete = async <TBody, TResponse>(route: string, body: TBody) =>
    _fetch<TResponse>(route, {
        body: JSON.stringify(body),
        headers: HEADERS,
        method: "DELETE",
    });

const postMultipartForm = async <TResponse>(
    route: string,
    formData: FormData
) =>
    _fetch<TResponse>(route, {
        body: formData,
        method: "POST",
    });

const put = async <TBody, TResponse>(route: string, body: TBody) =>
    _fetch<TResponse>(route, {
        body: JSON.stringify(body),
        headers: HEADERS,
        method: "PUT",
    });

const putMultipartForm = async <TResponse>(route: string, formData: FormData) =>
    _fetch<TResponse>(route, {
        body: formData,
        method: "PUT",
    });

export { _delete, get, post, postMultipartForm, put, putMultipartForm };
