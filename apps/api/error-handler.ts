import type { NextFunction, Request, Response } from "express";
import { ErrorName, isNotFoundError } from "common";
import { isDevelopment } from "./utilities/environment";
import {
    UnhandledError,
    isPostgrestError,
    isUniqueConstraintError,
} from "./utilities/errors";
import {
    badRequest,
    conflict,
    internalError,
    notFound,
} from "./utilities/responses";

/**
 * Global error handler for uncaught exceptions, which attempts to properly set the status code
 * and mask any sensitive error data before responding to the client. All four arguments need to be
 * specified, even if not used, for express to register the function as an error handler.
 * @see https://expressjs.com/en/guide/error-handling.html#writing-error-handlers
 */
const errorHandler = async (
    error: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction
) => {
    if (isNotFoundError(error)) {
        return notFound(response, error);
    }

    if (
        error instanceof Error &&
        (error.name === ErrorName.ERROR_MULTER ||
            error.name === ErrorName.ERROR_VALIDATION)
    ) {
        return badRequest(response, error);
    }

    if (isPostgrestError(error)) {
        if (isUniqueConstraintError(error)) {
            return conflict(response, {
                message: error.details,
                name: ErrorName.ERROR_UNIQUE_CONSTRAINT,
            });
        }

        return internalError(
            response,
            isDevelopment() ? error : new UnhandledError()
        );
    }

    return internalError(response, error);
};

export { errorHandler };
