import {
    PersistenceError,
    UniqueConstraintError,
    ValidationError,
} from "common";
import { assert, describe, expect, it, vi } from "vitest";
import {
    PocketBaseHttpError,
    PocketBaseTransportError,
} from "@/pocketbase-client";
import { withPocketBaseResult } from "@/storage/pocketbase-errors";

describe("withPocketBaseResult", () => {
    it("exposes the conflicting field without requiring PocketBase knowledge", async () => {
        const cause = new PocketBaseHttpError(
            400,
            {
                data: {
                    slug: {
                        code: "validation_not_unique",
                        message: "Slug is taken",
                    },
                },
            },
            "POST",
            "/api/batch"
        );
        const operation = withPocketBaseResult(
            vi.fn().mockRejectedValue(cause)
        );

        const result = await operation();

        assert(result.isErr);
        expect(result.error).toBeInstanceOf(UniqueConstraintError);
        expect(result.error).toMatchObject({
            cause,
            field: "slug",
            message: "Slug is taken",
        });
    });

    it("identifies a slug collision even without a provider message", async () => {
        const cause = new PocketBaseHttpError(
            400,
            {
                data: { slug: { code: "validation_not_unique" } },
            },
            "POST",
            "/api/batch"
        );
        const operation = withPocketBaseResult(
            vi.fn().mockRejectedValue(cause)
        );

        const result = await operation();

        assert(result.isErr);
        expect(result.error).toMatchObject({
            field: "slug",
            name: "ERROR_UNIQUE_CONSTRAINT",
        });
    });

    it("preserves native quota validation messages", async () => {
        const cause = new PocketBaseHttpError(
            400,
            {
                data: { size: { message: "Board storage quota exceeded" } },
                message: "Failed to create record",
            },
            "POST",
            "/api/batch"
        );
        const operation = withPocketBaseResult(
            vi.fn().mockRejectedValue(cause)
        );

        const result = await operation();

        assert(result.isErr);
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toBe("Board storage quota exceeded");
    });

    it("falls back to a top-level validation message", async () => {
        const cause = new PocketBaseHttpError(
            400,
            { message: "Invalid request" },
            "POST",
            "/api/batch"
        );
        const operation = withPocketBaseResult(
            vi.fn().mockRejectedValue(cause)
        );

        const result = await operation();

        assert(result.isErr);
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toBe("Invalid request");
    });

    it("keeps unexpected provider diagnostics as the cause of a persistence error", async () => {
        const cause = new PocketBaseHttpError(
            503,
            "Unavailable",
            "GET",
            "/api/collections/boards/records"
        );
        const operation = withPocketBaseResult(
            vi.fn().mockRejectedValue(cause)
        );

        const result = await operation();

        assert(result.isErr);
        expect(result.error).toBeInstanceOf(PersistenceError);
        expect(result.error).toHaveProperty("cause", cause);
    });

    it("preserves errors unrelated to PocketBase", async () => {
        const error = new Error("Connection lost");
        const operation = withPocketBaseResult(
            vi.fn().mockRejectedValue(error)
        );

        const result = operation();

        await expect(result).rejects.toBe(error);
    });

    it("returns transport failures with the underlying diagnostics preserved", async () => {
        const cause = new TypeError("Connection lost after write");
        const error = new PocketBaseTransportError(cause);
        const operation = withPocketBaseResult(
            vi.fn().mockRejectedValue(error)
        );

        const result = await operation();

        assert(result.isPersistenceError());
        expect(result.error.cause).toBe(error);
        expect(result.error.cause.cause).toBe(cause);
    });
});
