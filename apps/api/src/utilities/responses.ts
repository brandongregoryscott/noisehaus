import type { ApiSuccessResponse, ApiErrorResponse, Result } from "common";
import type { Response } from "express";
import {
    ErrorName,
    isNotFoundError,
    UnhandledError,
    UniqueConstraintError,
    PersistenceError,
} from "common";
import { logger } from "@/logging";
import { isDevelopment } from "@/utilities/environment";

type ResultResponse<T> =
    Response<ApiErrorResponse> | Response<ApiSuccessResponse<T>>;

class HttpResponse {
    // eslint-disable-next-line collation/prefer-native-private-syntax -- JavaScript has no private constructor syntax.
    private constructor() {}

    static badRequest(
        response: Response,
        error: unknown
    ): Response<ApiErrorResponse> {
        return response.status(400).json({ data: null, error });
    }

    static conflict(
        response: Response,
        error: unknown
    ): Response<ApiErrorResponse> {
        return response.status(409).json({ data: null, error });
    }

    // The name selects the success status; failures use the shared error mapper.
    static created<T, E>(
        response: Response,
        result: Result<T, E>
    ): ResultResponse<T> {
        return result.isErr
            ? HttpResponse.error(response, result.error)
            : response.status(201).json({ data: result.value, error: null });
    }

    static error(
        response: Response,
        cause: unknown
    ): Response<ApiErrorResponse> {
        const log = response.req?.logger ?? logger;

        if (isNotFoundError(cause)) {
            log.warn({ err: cause, event: "request.rejected" }, "not found");
            return HttpResponse.notFound(response, cause);
        }

        if (
            cause instanceof Error &&
            (cause.name === ErrorName.ERROR_MULTER ||
                cause.name === ErrorName.ERROR_VALIDATION)
        ) {
            log.warn({ err: cause, event: "request.rejected" }, "bad request");
            return HttpResponse.badRequest(response, cause);
        }

        if (cause instanceof UniqueConstraintError) {
            log.warn(
                { err: cause, event: "request.rejected" },
                "unique constraint"
            );
            return HttpResponse.conflict(response, {
                message: cause.message,
                name: cause.name,
            });
        }

        if (cause instanceof PersistenceError) {
            log.error(
                { err: cause, event: "request.failed" },
                "persistence error"
            );
            return HttpResponse.internalError(
                response,
                isDevelopment() ? cause.cause : new UnhandledError()
            );
        }

        log.error({ err: cause, event: "request.failed" }, "unhandled error");
        return HttpResponse.internalError(response, cause);
    }

    static internalError(
        response: Response,
        error: unknown
    ): Response<ApiErrorResponse> {
        return response.status(500).json({ data: null, error });
    }

    static notFound(
        response: Response,
        error: unknown
    ): Response<ApiErrorResponse> {
        return response.status(404).json({ data: null, error });
    }

    static ok<T, E>(
        response: Response,
        result: Result<T, E>
    ): ResultResponse<T> {
        return result.isErr
            ? HttpResponse.error(response, result.error)
            : response.status(200).json({ data: result.value, error: null });
    }

    static tooManyRequests(
        response: Response,
        error: unknown
    ): Response<ApiErrorResponse> {
        return response.status(429).json({ data: null, error });
    }
}

export { HttpResponse };
