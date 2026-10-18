import { assert, describe, expect, it } from "vitest";
import type { StoreError } from "@/utilities/errors";
import type { Result } from "@/utilities/result";
import { UniqueConstraintError, ValidationError } from "@/utilities/errors";
import { err, ok } from "@/utilities/result";

describe("application Result", () => {
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
        const result = err({ field: "slug", kind: "unique-constraint" });

        expect(result.isUniqueConstraintError()).toBe(false);
    });
});
