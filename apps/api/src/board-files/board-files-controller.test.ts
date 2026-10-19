import type { Request, Response } from "express";
import { BOARD_NOT_FOUND_ERROR, err, ok, ValidationError } from "common";
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

    it("returns 400 when bulk upload validation fails", async () => {
        const cause = new ValidationError("Quota exceeded");
        const insert = vi
            .spyOn(BoardFilesService, "bulkInsert")
            .mockResolvedValue(err(cause));
        const response = createResponse();

        await BoardFilesController.create(request, response);

        expect(insert).toHaveBeenCalledWith({
            boardSlug: "drums",
            displayNames: ["Sound"],
            emojis: ["null"],
            files: request.files,
            token: "token-a",
        });
        expect(response.status).toHaveBeenCalledWith(400);
        expect(response.json).toHaveBeenCalledWith({
            data: null,
            error: cause,
        });
    });

    it("returns 404 when deletion is denied", async () => {
        const remove = vi
            .spyOn(BoardFilesService, "delete")
            .mockResolvedValue(err(BOARD_NOT_FOUND_ERROR));
        const response = createResponse();

        await BoardFilesController.delete(request, response);

        expect(remove).toHaveBeenCalledWith("sound-a", "drums", "token-a");
        expect(response.status).toHaveBeenCalledWith(404);
        expect(response.json).toHaveBeenCalledWith({
            data: null,
            error: BOARD_NOT_FOUND_ERROR,
        });
    });

    it("returns 404 when a file cannot be read", async () => {
        const get = vi
            .spyOn(BoardFilesService, "get")
            .mockResolvedValue(err(BOARD_NOT_FOUND_ERROR));
        const response = createResponse();

        await BoardFilesController.get(request, response);

        expect(get).toHaveBeenCalledWith({
            boardSlug: "drums",
            id: "sound-a",
            token: undefined,
        });
        expect(response.status).toHaveBeenCalledWith(404);
        expect(response.json).toHaveBeenCalledWith({
            data: null,
            error: BOARD_NOT_FOUND_ERROR,
        });
    });

    it("returns 404 when the board files cannot be listed", async () => {
        const list = vi
            .spyOn(BoardFilesService, "listByBoardSlug")
            .mockResolvedValue(err(BOARD_NOT_FOUND_ERROR));
        const response = createResponse();

        await BoardFilesController.list(request, response);

        expect(list).toHaveBeenCalledWith("drums");
        expect(response.status).toHaveBeenCalledWith(404);
        expect(response.json).toHaveBeenCalledWith({
            data: null,
            error: BOARD_NOT_FOUND_ERROR,
        });
    });

    it("returns 404 when an update is denied", async () => {
        const update = vi
            .spyOn(BoardFilesService, "update")
            .mockResolvedValue(err(BOARD_NOT_FOUND_ERROR));
        const response = createResponse();

        await BoardFilesController.update(request, response);

        expect(update).toHaveBeenCalledWith({
            boardSlug: "drums",
            displayName: undefined,
            emoji: undefined,
            file: undefined,
            id: "sound-a",
            token: "token-a",
        });
        expect(response.status).toHaveBeenCalledWith(404);
        expect(response.json).toHaveBeenCalledWith({
            data: null,
            error: BOARD_NOT_FOUND_ERROR,
        });
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
