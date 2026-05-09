import { ErrorName } from "common";
import { PocketBaseHttpError } from "@/pocketbase-client";

const UNIQUE_CONSTRAINT_CODE = "validation_not_unique";

class NotFoundError extends Error {
    constructor(message: string) {
        super();
        this.name = ErrorName.ERROR_NOT_FOUND;
        this.message = message;
    }
}

class UnexpectedNullError extends Error {
    constructor(valueName?: string) {
        super();
        this.name = ErrorName.ERROR_UNEXPECTED_NULL;
        this.message =
            valueName !== undefined
                ? `'${valueName}' was unexpectedly null.`
                : "A required value was unexpectedly null";
    }
}

class UnhandledError extends Error {
    constructor(message?: string) {
        super();
        this.name = ErrorName.ERROR_UNHANDLED;
        this.message =
            message !== undefined ? message : "An unhandled error occurred.";
    }
}

class ValidationError extends Error {
    constructor(message: string) {
        super();
        this.name = ErrorName.ERROR_VALIDATION;
        this.message = message;
    }
}

const BOARD_NOT_FOUND_ERROR = new NotFoundError(
    "No board with this slug was found, or you don't have permission to view it."
);

const isPocketBaseUniqueConstraintError = (
    error: unknown,
    field: string
): boolean => {
    if (!(error instanceof PocketBaseHttpError)) {
        return false;
    }

    if (error.status !== 400 || error.data == null || typeof error.data !== "object") {
        return false;
    }

    const { data } = error.data as { data?: Record<string, { code?: string }> };
    return data?.[field]?.code === UNIQUE_CONSTRAINT_CODE;
};

const isPocketBaseHttpError = (error: unknown): error is PocketBaseHttpError =>
    error instanceof PocketBaseHttpError;

const getPocketBaseUniqueConstraintMessage = (
    error: PocketBaseHttpError
): null | string => {
    if (error.data == null || typeof error.data !== "object") {
        return null;
    }

    const { data } = error.data as {
        data?: Record<string, { code?: string; message?: string }>;
    };
    const entry = Object.values(data ?? {}).find(
        (fieldError) => fieldError.code === UNIQUE_CONSTRAINT_CODE
    );

    return entry?.message ?? null;
};

const getPocketBaseValidationMessage = (
    error: PocketBaseHttpError
): null | string => {
    if (error.status !== 400 || error.data == null || typeof error.data !== "object") {
        return null;
    }

    const pbErrorData = error.data as {
        data?: Record<string, { message?: string }>;
        message?: string;
    };

    const fieldMessage = Object.values(pbErrorData.data ?? {}).find(
        (fieldError) => fieldError.message != null
    )?.message;

    return fieldMessage ?? pbErrorData.message ?? null;
};

export { BOARD_NOT_FOUND_ERROR, getPocketBaseUniqueConstraintMessage, getPocketBaseValidationMessage, isPocketBaseHttpError, isPocketBaseUniqueConstraintError, NotFoundError, UnexpectedNullError, UnhandledError, ValidationError };
