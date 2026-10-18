import type { NextFunction, Request, Response } from "express";
import {
    ErrorName,
    PersistenceError,
    UniqueConstraintError,
    ValidationError,
} from "common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errorHandler } from "@/error-handler";
import { isDevelopment } from "@/utilities/environment";

vi.mock("./utilities/environment", () => ({ isDevelopment: vi.fn() }));

const request = { logger: { error: vi.fn() } } as unknown as Request;
const next = vi.fn() as NextFunction;
const createResponse = () =>
    ({
        json: vi.fn().mockReturnThis(),
        status: vi.fn().mockReturnThis(),
    }) as unknown as Response;

describe("errorHandler", () => {
    beforeEach(() => vi.mocked(isDevelopment).mockReturnValue(false));

    it("returns a conflict without exposing persistence diagnostics", async () => {
        const error = new UniqueConstraintError(
            "slug",
            "Slug is taken",
            new Error("private diagnostics")
        );
        const response = createResponse();

        await errorHandler(error, request, response, next);

        expect(response.status).toHaveBeenCalledWith(409);
        expect(response.json).toHaveBeenCalledWith({
            data: null,
            error: {
                message: "Slug is taken",
                name: ErrorName.ERROR_UNIQUE_CONSTRAINT,
            },
        });
    });

    it("returns a validation error without serializing its cause", async () => {
        const error = new ValidationError(
            "Board storage quota exceeded",
            new Error("private diagnostics")
        );
        const response = createResponse();

        await errorHandler(error, request, response, next);

        expect(response.status).toHaveBeenCalledWith(400);
        expect(
            JSON.parse(
                JSON.stringify(vi.mocked(response.json).mock.calls[0][0])
            )
        ).toEqual({
            data: null,
            error: {
                message: "Board storage quota exceeded",
                name: ErrorName.ERROR_VALIDATION,
            },
        });
    });

    it("hides unexpected persistence failures in production", async () => {
        const error = new PersistenceError(new Error("private diagnostics"));
        const response = createResponse();

        await errorHandler(error, request, response, next);

        expect(response.status).toHaveBeenCalledWith(500);
        expect(response.json).toHaveBeenCalledWith({
            data: null,
            error: expect.objectContaining({ name: ErrorName.ERROR_UNHANDLED }),
        });
        expect(
            JSON.stringify(vi.mocked(response.json).mock.calls[0][0])
        ).not.toContain("private diagnostics");
    });

    it("retains underlying diagnostics in development", async () => {
        vi.mocked(isDevelopment).mockReturnValue(true);
        const cause = new Error("private diagnostics");
        const response = createResponse();

        await errorHandler(
            new PersistenceError(cause),
            request,
            response,
            next
        );

        expect(response.status).toHaveBeenCalledWith(500);
        expect(response.json).toHaveBeenCalledWith({
            data: null,
            error: cause,
        });
    });
});
