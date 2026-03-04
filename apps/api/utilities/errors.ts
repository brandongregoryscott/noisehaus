import type { PostgrestError } from "@supabase/supabase-js";
import { ErrorName } from "common";

const UNIQUE_CONSTRAINT_CODE = "23505";

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

const isPostgrestError = (error: unknown): error is PostgrestError => {
    const keys: Array<keyof PostgrestError> = [
        "code",
        "hint",
        "message",
        "details",
    ];

    return (
        error != null &&
        typeof error === "object" &&
        keys.every((key) => key in error)
    );
};

const isUniqueConstraintError = (error: PostgrestError): boolean =>
    error.code === UNIQUE_CONSTRAINT_CODE;

export {
    BOARD_NOT_FOUND_ERROR,
    isPostgrestError,
    isUniqueConstraintError,
    NotFoundError,
    UnexpectedNullError,
    UnhandledError,
    ValidationError,
};
