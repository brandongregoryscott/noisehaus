import type { NextFunction, Request, Response } from "express";
import { ErrorName, isNotFoundError } from "common";
import { isDevelopment } from "@/utilities/environment";
import {
    ValidationError,
    UnhandledError,
    getPocketBaseValidationMessage,
    getPocketBaseUniqueConstraintMessage,
    isPocketBaseHttpError,
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

    if (isPocketBaseHttpError(error)) {
        const uniqueConstraintMessage =
            getPocketBaseUniqueConstraintMessage(error);
        if (uniqueConstraintMessage != null) {
            log.error(
                {
                    err: error,
                    pocketbase: { method: error.method, path: error.path },
                },
                "pocketbase unique constraint"
            );
            return conflict(response, {
                message: uniqueConstraintMessage,
                name: ErrorName.ERROR_UNIQUE_CONSTRAINT,
            });
        }

        const validationMessage = getPocketBaseValidationMessage(error);
        if (validationMessage != null) {
            log.error(
                {
                    err: error,
                    pocketbase: { method: error.method, path: error.path },
                },
                "pocketbase validation error"
            );
            return badRequest(response, new ValidationError(validationMessage));
        }

        log.error(
            {
                err: error,
                pocketbase: { method: error.method, path: error.path },
            },
            "pocketbase error"
        );
        return internalError(
            response,
            isDevelopment() ? error : new UnhandledError()
        );
    }

    log.error({ err: error }, "unhandled error");
    return internalError(response, error);
};

export { errorHandler };
