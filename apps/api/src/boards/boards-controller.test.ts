import type { CreateBoardRequest } from "common";
import type { Request, Response } from "express";
import { ErrorName, ViewPermission } from "common";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BoardsController } from "@/boards/boards-controller";
import { PocketBaseClient, PocketBaseHttpError } from "@/pocketbase-client";
import { isDevelopment } from "@/utilities/environment";

vi.mock("../utilities/environment", () => ({ isDevelopment: vi.fn() }));

const request = {
    body: { name: "Drums", slug: "drums" },
    logger: { error: vi.fn(), warn: vi.fn() },
} as unknown as CreateBoardRequest & Request;
const createResponse = () =>
    ({
        json: vi.fn().mockReturnThis(),
        req: request,
        status: vi.fn().mockReturnThis(),
    }) as unknown as Response;

describe("BoardsController", () => {
    afterEach(() => vi.restoreAllMocks());

    it("responds with the board and token rather than the Result wrapper", async () => {
        const board = {
            id: "board-a",
            name: "Drums",
            slug: "drums",
            viewPermission: ViewPermission.BySlug,
        };
        vi.spyOn(PocketBaseClient, "createRecords").mockResolvedValue([
            board,
            { token: "token-a" },
        ]);
        const response = createResponse();

        await BoardsController.create(request, response);

        expect(response.status).toHaveBeenCalledWith(201);
        expect(response.json).toHaveBeenCalledWith({
            data: { ...board, token: "token-a" },
            error: null,
        });
    });

    it("preserves error responses for provider failures", async () => {
        const testCases = [
            {
                calls: 6,
                data: {
                    data: {
                        slug: {
                            code: "validation_not_unique",
                            message: "Slug is taken",
                        },
                    },
                },
                httpStatus: 409,
                message: "Slug is taken",
                name: ErrorName.ERROR_UNIQUE_CONSTRAINT,
                status: 400,
            },
            {
                calls: 1,
                data: { message: "Invalid board" },
                httpStatus: 400,
                message: "Invalid board",
                name: ErrorName.ERROR_VALIDATION,
                status: 400,
            },
            {
                calls: 1,
                data: "Private provider diagnostics",
                httpStatus: 500,
                message: "An unhandled error occurred.",
                name: ErrorName.ERROR_UNHANDLED,
                status: 503,
            },
        ];
        vi.mocked(isDevelopment).mockReturnValue(false);
        const createRecords = vi.spyOn(PocketBaseClient, "createRecords");

        for (const {
            calls,
            data,
            httpStatus,
            message,
            name,
            status,
        } of testCases) {
            createRecords
                .mockReset()
                .mockRejectedValue(
                    new PocketBaseHttpError(status, data, "POST", "/api/batch")
                );
            const response = createResponse();

            await BoardsController.create(request, response);

            expect(response.status, name).toHaveBeenCalledWith(httpStatus);
            expect(
                JSON.parse(
                    JSON.stringify(vi.mocked(response.json).mock.calls[0][0])
                ),
                name
            ).toEqual({ data: null, error: { message, name } });
            expect(createRecords, name).toHaveBeenCalledTimes(calls);
        }
    });

    it("lets unexpected exceptions reach Express's fallback handler", async () => {
        const error = new Error("Unexpected failure");
        vi.spyOn(PocketBaseClient, "createRecords").mockRejectedValue(error);
        const response = createResponse();

        const result = BoardsController.create(request, response);

        await expect(result).rejects.toBe(error);
        expect(response.status).not.toHaveBeenCalled();
    });
});
