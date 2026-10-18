import type { ApiErrorResponse } from "common";
import { ErrorName, ViewPermission } from "common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBoard } from "@/boards/create-board";
import { post, postMultipartForm } from "@/utils/fetch";

vi.mock("../utils/fetch", () => ({
    post: vi.fn(),
    postMultipartForm: vi.fn(),
}));

const board = {
    createdAt: "2026-10-17T00:00:00Z",
    id: "board-a",
    name: "Board A",
    slug: "a",
    token: "token-a",
    updatedAt: "2026-10-17T00:00:00Z",
    viewPermission: ViewPermission.BySlug,
};

const options = {
    files: [
        {
            displayName: "Sound",
            file: new File(["sound"], "sound.wav", { type: "audio/wav" }),
        },
    ],
    name: board.name,
    slug: board.slug,
};

describe("createBoard", () => {
    beforeEach(() => {
        vi.mocked(post)
            .mockReset()
            .mockResolvedValue({ data: board, error: null });
        vi.mocked(postMultipartForm)
            .mockReset()
            .mockResolvedValue({ data: [], error: null });
    });

    it("returns the created board after its sounds upload", async () => {
        const result = await createBoard(options);

        expect(result).toEqual({ data: board, error: null });
        expect(post).toHaveBeenCalledWith("/boards", {
            name: board.name,
            slug: board.slug,
        });
        const [route, form] = vi.mocked(postMultipartForm).mock.calls[0];
        expect(route).toBe("/boards/a/files");
        expect(form.get("token")).toBe(board.token);
        expect(form.getAll("displayNames")).toEqual(["Sound"]);
        expect(form.getAll("files")).toHaveLength(1);
    });

    it("does not upload when no initial sounds are provided", async () => {
        const input = { name: board.name, slug: board.slug };

        const result = await createBoard(input);

        expect(result).toEqual({ data: board, error: null });
        expect(postMultipartForm).not.toHaveBeenCalled();
    });

    it("preserves the board and token after a rejected upload", async () => {
        const error = {
            message: "Board is full",
            name: ErrorName.ERROR_VALIDATION,
        };
        vi.mocked(postMultipartForm).mockResolvedValue({ data: null, error });

        const result = await createBoard(options);

        expect(result).toEqual({ data: board, error });
        expect(post).toHaveBeenCalledTimes(1);
        expect(postMultipartForm).toHaveBeenCalledTimes(1);
    });

    it.each([
        new TypeError("Network failure"),
        new SyntaxError("Invalid JSON"),
    ])("preserves access after an unconfirmed upload (%s)", async (error) => {
        vi.mocked(postMultipartForm).mockRejectedValue(error);

        const result = await createBoard(options);

        expect(result.data).toEqual(board);
        expect(result.error).toEqual({
            message:
                "Your board was created, but the upload could not be confirmed. Check its sounds before uploading again.",
            name: ErrorName.ERROR_UNHANDLED,
        });
        expect(post).toHaveBeenCalledTimes(1);
        expect(postMultipartForm).toHaveBeenCalledTimes(1);
    });

    it("retains access when an upload response has no result envelope", async () => {
        vi.mocked(postMultipartForm).mockResolvedValue({} as ApiErrorResponse);

        const result = await createBoard(options);

        expect(result.data).toEqual(board);
        expect(result.error).toMatchObject({ name: ErrorName.ERROR_UNHANDLED });
        expect(postMultipartForm).toHaveBeenCalledTimes(1);
    });

    it("does not upload after board creation is rejected", async () => {
        const error = {
            message: "Invalid board",
            name: ErrorName.ERROR_VALIDATION,
        };
        vi.mocked(post).mockResolvedValue({ data: null, error });

        const result = createBoard(options);

        await expect(result).rejects.toBe(error);
        expect(postMultipartForm).not.toHaveBeenCalled();
    });

    it("does not upload or retry when creation has an unknown outcome", async () => {
        const error = new TypeError("Network failure");
        vi.mocked(post).mockRejectedValue(error);

        const result = createBoard(options);

        await expect(result).rejects.toBe(error);
        expect(postMultipartForm).not.toHaveBeenCalled();
        expect(post).toHaveBeenCalledTimes(1);
    });
});
