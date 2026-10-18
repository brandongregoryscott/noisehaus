import { describe, expect, it, vi } from "vitest";
import { PocketBaseHttpError } from "@/pocketbase-client";
import { withPocketBaseErrors } from "@/storage/pocketbase-errors";
import {
    PersistenceError,
    UniqueConstraintError,
    ValidationError,
} from "@/utilities/errors";

describe("withPocketBaseErrors", () => {
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
        const operation = withPocketBaseErrors(
            vi.fn().mockRejectedValue(cause)
        );

        const result = operation();

        await expect(result).rejects.toBeInstanceOf(UniqueConstraintError);
        await expect(result).rejects.toMatchObject({
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
        const operation = withPocketBaseErrors(
            vi.fn().mockRejectedValue(cause)
        );

        const result = operation();

        await expect(result).rejects.toMatchObject({
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
        const operation = withPocketBaseErrors(
            vi.fn().mockRejectedValue(cause)
        );

        const result = operation();

        await expect(result).rejects.toBeInstanceOf(ValidationError);
        await expect(result).rejects.toThrow("Board storage quota exceeded");
    });

    it("falls back to a top-level validation message", async () => {
        const cause = new PocketBaseHttpError(
            400,
            { message: "Invalid request" },
            "POST",
            "/api/batch"
        );
        const operation = withPocketBaseErrors(
            vi.fn().mockRejectedValue(cause)
        );

        const result = operation();

        await expect(result).rejects.toBeInstanceOf(ValidationError);
        await expect(result).rejects.toThrow("Invalid request");
    });

    it("keeps unexpected provider diagnostics as the cause of a persistence error", async () => {
        const cause = new PocketBaseHttpError(
            503,
            "Unavailable",
            "GET",
            "/api/collections/boards/records"
        );
        const operation = withPocketBaseErrors(
            vi.fn().mockRejectedValue(cause)
        );

        const result = operation();

        await expect(result).rejects.toBeInstanceOf(PersistenceError);
        await expect(result).rejects.toHaveProperty("cause", cause);
    });

    it("preserves errors unrelated to PocketBase", async () => {
        const error = new Error("Connection lost");
        const operation = withPocketBaseErrors(
            vi.fn().mockRejectedValue(error)
        );

        const result = operation();

        await expect(result).rejects.toBe(error);
    });
});
