import type { Result } from "common";
import type { NextFunction, Request, Response } from "express";
import {
    ErrorName,
    isNotFoundError,
    UnhandledError,
    UniqueConstraintError,
    PersistenceError,
} from "common";
import { isDevelopment } from "@/utilities/environment";
import { logger } from "@/utilities/logger";
import {
    created,
    ok,
    badRequest,
    conflict,
    internalError,
    notFound,
} from "@/utilities/responses";

const sendErrorResponse = (
    error: unknown,
    request: Partial<Request>,
    response: Response
) => {
    const log = request.logger ?? logger;

    if (isNotFoundError(error)) {
        log.error({ err: error }, "not found");
        return notFound(response, error);
    }

    if (
        error instanceof Error &&
        (error.name === ErrorName.ERROR_MULTER ||
            error.name === ErrorName.ERROR_VALIDATION)
    ) {
        log.error({ err: error }, "bad request");
        return badRequest(response, error);
    }

    if (error instanceof UniqueConstraintError) {
        log.error({ err: error }, "unique constraint");
        return conflict(response, {
            message: error.message,
            name: error.name,
        });
    }

    if (error instanceof PersistenceError) {
        log.error({ err: error }, "persistence error");
        return internalError(
            response,
            isDevelopment() ? error.cause : new UnhandledError()
        );
    }

    log.error({ err: error }, "unhandled error");
    return internalError(response, error);
};

const sendResultResponse = <T, E>(
    result: Result<T, E>,
    request: Partial<Request>,
    response: Response,
    status: 200 | 201 = 200
): Response => {
    if (result.isErr) {
        return sendErrorResponse(result.error, request, response);
    }
    return status === 201
        ? created(response, result.value)
        : ok(response, result.value);
};

const errorHandler = (
    error: unknown,
    request: Request,
    response: Response,
    _next: NextFunction
) => sendErrorResponse(error, request, response);

export { errorHandler, sendErrorResponse, sendResultResponse };
