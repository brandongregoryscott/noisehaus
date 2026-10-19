import type { ApiSuccessResponse, ApiErrorResponse, Result } from "common";
import type { Response as ExpressResponse } from "express";
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
    | ExpressResponse<ApiErrorResponse>
    | ExpressResponse<ApiSuccessResponse<T>>;

class Response {
    // eslint-disable-next-line collation/prefer-native-private-syntax -- JavaScript has no private constructor syntax.
    private constructor() {}

    static badRequest(
        response: ExpressResponse,
        error: unknown
    ): ExpressResponse<ApiErrorResponse> {
        return response.status(400).json({ data: null, error });
    }

    static conflict(
        response: ExpressResponse,
        error: unknown
    ): ExpressResponse<ApiErrorResponse> {
        return response.status(409).json({ data: null, error });
    }

    // The name selects the success status; failures use the shared error mapper.
    static created<T, E>(
        response: ExpressResponse,
        result: Result<T, E>
    ): ResultResponse<T> {
        return result.isErr
            ? Response.error(response, result.error)
            : response.status(201).json({ data: result.value, error: null });
    }

    static error(
        response: ExpressResponse,
        cause: unknown
    ): ExpressResponse<ApiErrorResponse> {
        const log = response.req?.logger ?? logger;

        if (isNotFoundError(cause)) {
            log.error({ err: cause }, "not found");
            return Response.notFound(response, cause);
        }

        if (
            cause instanceof Error &&
            (cause.name === ErrorName.ERROR_MULTER ||
                cause.name === ErrorName.ERROR_VALIDATION)
        ) {
            log.error({ err: cause }, "bad request");
            return Response.badRequest(response, cause);
        }

        if (cause instanceof UniqueConstraintError) {
            log.error({ err: cause }, "unique constraint");
            return Response.conflict(response, {
                message: cause.message,
                name: cause.name,
            });
        }

        if (cause instanceof PersistenceError) {
            log.error({ err: cause }, "persistence error");
            return Response.internalError(
                response,
                isDevelopment() ? cause.cause : new UnhandledError()
            );
        }

        log.error({ err: cause }, "unhandled error");
        return Response.internalError(response, cause);
    }

    static internalError(
        response: ExpressResponse,
        error: unknown
    ): ExpressResponse<ApiErrorResponse> {
        return response.status(500).json({ data: null, error });
    }

    static notFound(
        response: ExpressResponse,
        error: unknown
    ): ExpressResponse<ApiErrorResponse> {
        return response.status(404).json({ data: null, error });
    }

    static ok<T, E>(
        response: ExpressResponse,
        result: Result<T, E>
    ): ResultResponse<T> {
        return result.isErr
            ? Response.error(response, result.error)
            : response.status(200).json({ data: result.value, error: null });
    }

    static tooManyRequests(
        response: ExpressResponse,
        error: unknown
    ): ExpressResponse<ApiErrorResponse> {
        return response.status(429).json({ data: null, error });
    }
}

export { Response };
