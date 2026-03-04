type ApiError = {
    message: string;
    name: string;
};

enum ErrorName {
    ERROR_MULTER = "MulterError",
    ERROR_NOT_FOUND = "ERROR_NOT_FOUND",
    ERROR_RATE_LIMIT_EXCEEDED = "ERROR_RATE_LIMIT_EXCEEDED",
    ERROR_UNEXPECTED_NULL = "ERROR_UNEXPECTED_NULL",
    ERROR_UNHANDLED = "ERROR_UNHANDLED",
    ERROR_UNIQUE_CONSTRAINT = "ERROR_UNIQUE_CONSTRAINT",
    ERROR_VALIDATION = "ERROR_VALIDATION",
}

const isNotFoundError = (error: unknown): error is ApiError =>
    error != null &&
    typeof error === "object" &&
    "name" in error &&
    error.name === ErrorName.ERROR_NOT_FOUND;

export type { ApiError };
export { ErrorName, isNotFoundError };
