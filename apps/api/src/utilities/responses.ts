import type { ApiSuccessResponse, ApiErrorResponse, Result } from "common";
import type { Response } from "express";
import {
    ErrorName,
    isNotFoundError,
    UnhandledError,
    UniqueConstraintError,
    PersistenceError,
} from "common";
import { isDevelopment } from "@/utilities/environment";
import { logger } from "@/utilities/logger";

type ResultResponse<T> =
    | Response<ApiErrorResponse>
    | Response<ApiSuccessResponse<T>>;

// The name selects the success status; failures use the shared error mapper.
const created = <T, E>(
    response: Response,
    result: Result<T, E>
): ResultResponse<T> =>
    result.isErr
        ? error(response, result.error)
        : response.status(201).json({ data: result.value, error: null });

const ok = <T, E>(
    response: Response,
    result: Result<T, E>
): ResultResponse<T> =>
    result.isErr
        ? error(response, result.error)
        : response.status(200).json({ data: result.value, error: null });

const conflict = (
    response: Response,
    error: unknown
): Response<ApiErrorResponse> =>
    response.status(409).json({ data: null, error });

const badRequest = (
    response: Response,
    error: unknown
): Response<ApiErrorResponse> =>
    response.status(400).json({ data: null, error });

const notFound = (
    response: Response,
    error: unknown
): Response<ApiErrorResponse> =>
    response.status(404).json({ data: null, error });

const tooManyRequests = (
    response: Response,
    error: unknown
): Response<ApiErrorResponse> =>
    response.status(429).json({ data: null, error });

const internalError = (
    response: Response,
    error: unknown
): Response<ApiErrorResponse> =>
    response.status(500).json({ data: null, error });

const error = (
    response: Response,
    cause: unknown
): Response<ApiErrorResponse> => {
    const log = response.req?.logger ?? logger;

    if (isNotFoundError(cause)) {
        log.error({ err: cause }, "not found");
        return notFound(response, cause);
    }

    if (
        cause instanceof Error &&
        (cause.name === ErrorName.ERROR_MULTER ||
            cause.name === ErrorName.ERROR_VALIDATION)
    ) {
        log.error({ err: cause }, "bad request");
        return badRequest(response, cause);
    }

    if (cause instanceof UniqueConstraintError) {
        log.error({ err: cause }, "unique constraint");
        return conflict(response, {
            message: cause.message,
            name: cause.name,
        });
    }

    if (cause instanceof PersistenceError) {
        log.error({ err: cause }, "persistence error");
        return internalError(
            response,
            isDevelopment() ? cause.cause : new UnhandledError()
        );
    }

    log.error({ err: cause }, "unhandled error");
    return internalError(response, cause);
};

export {
    badRequest,
    conflict,
    created,
    error,
    internalError,
    notFound,
    ok,
    tooManyRequests,
};
