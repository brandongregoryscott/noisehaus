import type { Response } from "express";
import {
    err,
    ErrorName,
    NotFoundError,
    ok,
    PersistenceError,
    UniqueConstraintError,
    ValidationError,
} from "common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isDevelopment } from "@/utilities/environment";
import { logger } from "@/utilities/logger";
import { HttpResponse } from "@/utilities/responses";

vi.mock("./environment", () => ({ isDevelopment: vi.fn() }));
vi.mock("./logger", () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));

const createResponse = (log?: ReturnType<typeof vi.fn>): Response =>
    ({
        ...(log === undefined
            ? {}
            : { req: { logger: { error: log, warn: log } } }),
        json: vi.fn().mockReturnThis(),
        status: vi.fn().mockReturnThis(),
    }) as unknown as Response;

const helpers = [
    { name: "ok", send: HttpResponse.ok, status: 200 },
    { name: "created", send: HttpResponse.created, status: 201 },
];

describe("HttpResponse", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(isDevelopment).mockReturnValue(false);
    });

    it("uses each helper's success status and unwraps its payload", () => {
        const payload = { id: "board-a", token: "token-a" };
        const result = ok(payload);

        for (const { name, send, status } of helpers) {
            const log = vi.fn();
            const response = createResponse(log);

            const sent = send(response, result);

            expect(sent, name).toBe(response);
            expect(response.status, name).toHaveBeenCalledWith(status);
            expect(response.json, name).toHaveBeenCalledWith({
                data: payload,
                error: null,
            });
            expect(log, name).not.toHaveBeenCalled();
            expect(logger.error, name).not.toHaveBeenCalled();
        }
    });

    it("preserves false payloads as successful responses", () => {
        const result = ok(false);

        for (const { name, send, status } of helpers) {
            const response = createResponse();

            send(response, result);

            expect(response.status, name).toHaveBeenCalledWith(status);
            expect(response.json, name).toHaveBeenCalledWith({
                data: false,
                error: null,
            });
        }
    });

    it("maps failures independently of the helper's success status", () => {
        const testCases = [
            {
                cause: new NotFoundError("Board not found"),
                logMessage: "not found",
                message: "Board not found",
                name: ErrorName.ERROR_NOT_FOUND,
                status: 404,
            },
            {
                cause: new ValidationError(
                    "Invalid upload",
                    new Error("private diagnostics")
                ),
                logMessage: "bad request",
                message: "Invalid upload",
                name: ErrorName.ERROR_VALIDATION,
                status: 400,
            },
            {
                cause: new UniqueConstraintError(
                    "slug",
                    "Slug is taken",
                    new Error("private diagnostics")
                ),
                logMessage: "unique constraint",
                message: "Slug is taken",
                name: ErrorName.ERROR_UNIQUE_CONSTRAINT,
                status: 409,
            },
            {
                cause: new PersistenceError(new Error("private diagnostics")),
                logMessage: "persistence error",
                message: "An unhandled error occurred.",
                name: ErrorName.ERROR_UNHANDLED,
                status: 500,
            },
        ];

        for (const { cause, logMessage, message, name, status } of testCases) {
            const result = err(cause);

            for (const { name: helper, send } of helpers) {
                const log = vi.fn();
                const response = createResponse(log);

                send(response, result);

                expect(
                    response.status,
                    `${helper}: ${name}`
                ).toHaveBeenCalledWith(status);
                expect(
                    JSON.parse(
                        JSON.stringify(
                            vi.mocked(response.json).mock.calls[0][0]
                        )
                    ),
                    `${helper}: ${name}`
                ).toEqual({ data: null, error: { message, name } });
                expect(
                    log,
                    `${helper}: ${name}`
                ).toHaveBeenCalledExactlyOnceWith(
                    {
                        err: cause,
                        event:
                            status < 500
                                ? "request.rejected"
                                : "request.failed",
                    },
                    logMessage
                );
                expect(logger.error, helper).not.toHaveBeenCalled();
            }
        }
    });

    it("uses the fallback logger when no request logger is available", () => {
        const cause = new ValidationError("Invalid upload");
        const response = createResponse();

        HttpResponse.error(response, cause);

        expect(logger.warn).toHaveBeenCalledExactlyOnceWith(
            { err: cause, event: "request.rejected" },
            "bad request"
        );
        expect(response.status).toHaveBeenCalledWith(400);
    });
});
