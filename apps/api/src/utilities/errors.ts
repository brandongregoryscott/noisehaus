import { ErrorName } from "common";

const ErrorKind = {
    Persistence: "persistence",
    UniqueConstraint: "unique-constraint",
    Validation: "validation",
} as const;

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
    cause?: unknown;

    constructor(message: string, cause?: unknown) {
        super();
        Object.defineProperty(this, "cause", {
            enumerable: false,
            value: cause,
        });
        this.name = ErrorName.ERROR_VALIDATION;
        this.message = message;
    }

    get kind() {
        return ErrorKind.Validation;
    }
}

const BOARD_NOT_FOUND_ERROR = new NotFoundError(
    "No board with this slug was found, or you don't have permission to view it."
);

class UniqueConstraintError extends Error {
    cause: unknown;
    field: string;

    constructor(field: string, message: string, cause: unknown) {
        super(message);
        this.cause = cause;
        this.name = ErrorName.ERROR_UNIQUE_CONSTRAINT;
        this.message = message;
        this.field = field;
    }

    get kind() {
        return ErrorKind.UniqueConstraint;
    }
}

class PersistenceError extends Error {
    cause: Error;
    constructor(cause: Error) {
        super(cause.message);
        this.cause = cause;
    }

    get kind() {
        return ErrorKind.Persistence;
    }
}

type StoreError = PersistenceError | UniqueConstraintError | ValidationError;

export type { StoreError };
export {
    BOARD_NOT_FOUND_ERROR,
    ErrorKind,
    NotFoundError,
    PersistenceError,
    UnexpectedNullError,
    UnhandledError,
    UniqueConstraintError,
    ValidationError,
};
