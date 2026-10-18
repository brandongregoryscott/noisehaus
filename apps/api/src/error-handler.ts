import type { NextFunction, Request, Response } from "express";
import { ErrorName, isNotFoundError } from "common";
import { isDevelopment } from "@/utilities/environment";
import {
    UnhandledError,
    UniqueConstraintError,
    PersistenceError,
} from "@/utilities/errors";
import { logger } from "@/utilities/logger";
import {
    badRequest,
    conflict,
    internalError,
    notFound,
} from "@/utilities/responses";

const errorHandler = async (
    error: unknown,
    request: Request,
    response: Response,
    _next: NextFunction
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

export { errorHandler };
