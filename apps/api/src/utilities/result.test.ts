import type { StoreError, Result } from "common";
import {
    NotFoundError,
    PersistenceError,
    ErrorKind,
    UniqueConstraintError,
    ValidationError,
    err,
    ok,
} from "common";
import { assert, describe, expect, it } from "vitest";

describe("Result", () => {
    it("narrows successful results and preserves their value", () => {
        const value = { token: "token-a" };
        const result = ok(value);

        assert(result.isOk);
        expect(result.isErr).toBe(false);
        expect(result.value).toBe(value);
        expect(result.isUniqueConstraintError()).toBe(false);
        expect(result.isUniqueConstraintError("slug")).toBe(false);
    });

    it("narrows failures and preserves their error and cause", () => {
        const cause = new Error("Provider diagnostics");
        const error = new ValidationError("Invalid board", cause);
        const result = err(error);

        assert(result.isErr);
        expect(result.isOk).toBe(false);
        expect(result.error).toBe(error);
        expect(result.error.cause).toBe(cause);
        expect(result.isUniqueConstraintError()).toBe(false);
    });

    it("identifies unique constraints and narrows a union without an isErr check", () => {
        const cause = new Error("Provider diagnostics");
        const error = new UniqueConstraintError("slug", "Slug is taken", cause);
        const result: Result<number, StoreError> = err(error);

        assert(result.isUniqueConstraintError());
        expect(result.isErr).toBe(true);
        expect(result.error.field).toBe("slug");
        expect(result.error).toBe(error);
        expect(result.error.cause).toBe(cause);
        expect(result.isUniqueConstraintError("slug")).toBe(true);
        expect(result.isUniqueConstraintError("token")).toBe(false);
    });

    it("does not treat lookalike errors as unique constraint failures", () => {
        const result = err({ field: "slug", kind: ErrorKind.UniqueConstraint });

        expect(result.isUniqueConstraintError()).toBe(false);
    });
    it("narrows application failures using their specific predicates", () => {
        const missing: Result<number, NotFoundError | StoreError> = err(
            new NotFoundError("Missing")
        );
        assert(missing.isNotFoundError());
        expect(missing.error.kind).toBe(ErrorKind.NotFound);
        expect(missing.isValidationError()).toBe(false);

        const persistence: Result<number, StoreError> = err(
            new PersistenceError(new Error("Unavailable"))
        );
        assert(persistence.isPersistenceError());
        expect(persistence.error.cause.message).toBe("Unavailable");
        expect(persistence.isNotFoundError()).toBe(false);

        const validation: Result<number, StoreError> = err(
            new ValidationError("Invalid board")
        );
        assert(validation.isValidationError());
        expect(validation.error.message).toBe("Invalid board");

        const success = ok(42);
        expect(success.isNotFoundError()).toBe(false);
        expect(success.isValidationError()).toBe(false);
        expect(success.isPersistenceError()).toBe(false);
    });
});
