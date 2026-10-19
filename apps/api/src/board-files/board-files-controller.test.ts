import type { Request, Response } from "express";
import {
    BOARD_NOT_FOUND_ERROR,
    err,
    ErrorName,
    ok,
    ValidationError,
} from "common";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BoardFilesController } from "@/board-files/board-files-controller";
import { BoardFilesService } from "@/board-files/board-files-service";

const request = {
    body: { displayNames: ["Sound"], emojis: ["null"], token: "token-a" },
    files: [{ originalname: "sound.wav", size: 5 }],
    logger: { error: vi.fn() },
    params: { id: "sound-a", slug: "drums" },
    query: {},
} as unknown as Request;
const createResponse = () =>
    ({
        json: vi.fn().mockReturnThis(),
        req: request,
        status: vi.fn().mockReturnThis(),
    }) as unknown as Response;

describe("BoardFilesController", () => {
    afterEach(() => vi.restoreAllMocks());

    it("formats service failures for reads, writes, and lists", async () => {
        const testCases = [
            {
                arrange: () =>
                    vi
                        .spyOn(BoardFilesService, "bulkInsert")
                        .mockResolvedValue(
                            err(new ValidationError("Quota exceeded"))
                        ),
                error: ErrorName.ERROR_VALIDATION,
                name: "create",
                operation: BoardFilesController.create,
                status: 400,
            },
            {
                arrange: () =>
                    vi
                        .spyOn(BoardFilesService, "delete")
                        .mockResolvedValue(err(BOARD_NOT_FOUND_ERROR)),
                error: ErrorName.ERROR_NOT_FOUND,
                name: "delete",
                operation: BoardFilesController.delete,
                status: 404,
            },
            {
                arrange: () =>
                    vi
                        .spyOn(BoardFilesService, "get")
                        .mockResolvedValue(err(BOARD_NOT_FOUND_ERROR)),
                error: ErrorName.ERROR_NOT_FOUND,
                name: "get",
                operation: BoardFilesController.get,
                status: 404,
            },
            {
                arrange: () =>
                    vi
                        .spyOn(BoardFilesService, "listByBoardSlug")
                        .mockResolvedValue(err(BOARD_NOT_FOUND_ERROR)),
                error: ErrorName.ERROR_NOT_FOUND,
                name: "list",
                operation: BoardFilesController.list,
                status: 404,
            },
            {
                arrange: () =>
                    vi
                        .spyOn(BoardFilesService, "update")
                        .mockResolvedValue(err(BOARD_NOT_FOUND_ERROR)),
                error: ErrorName.ERROR_NOT_FOUND,
                name: "update",
                operation: BoardFilesController.update,
                status: 404,
            },
        ];

        for (const { arrange, error, name, operation, status } of testCases) {
            vi.restoreAllMocks();
            arrange();
            const response = createResponse();

            await operation(request, response);

            expect(response.status, name).toHaveBeenCalledWith(status);
            expect(response.json, name).toHaveBeenCalledWith({
                data: null,
                error: expect.objectContaining({ name: error }),
            });
        }
    });

    it("returns success values rather than result wrappers", async () => {
        vi.spyOn(BoardFilesService, "delete").mockResolvedValue(ok(true));
        const response = createResponse();

        await BoardFilesController.delete(request, response);

        expect(response.json).toHaveBeenCalledWith({ data: true, error: null });
    });

    it("returns decoding failures before calling the service", async () => {
        const insert = vi.spyOn(BoardFilesService, "bulkInsert");
        const response = createResponse();

        await BoardFilesController.create(
            { ...request, files: [] } as unknown as Request,
            response
        );

        expect(response.status).toHaveBeenCalledWith(400);
        expect(insert).not.toHaveBeenCalled();
    });
});
