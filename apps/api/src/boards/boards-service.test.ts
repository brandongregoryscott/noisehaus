import { ViewPermission } from "common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BoardTokensStore } from "@/board-tokens/board-tokens-store";
import { BoardsService } from "@/boards/boards-service";
import { BoardsStore } from "@/boards/boards-store";
import {
    BOARD_NOT_FOUND_ERROR,
    UniqueConstraintError,
} from "@/utilities/errors";
import { randomSuffix } from "@/utilities/string-utils";

vi.mock("../utilities/string-utils", () => ({ randomSuffix: vi.fn() }));
const board = {
    createdAt: "2026-10-17T00:00:00Z",
    id: "board-a",
    name: "Drums",
    slug: "drums",
    updatedAt: "2026-10-17T00:00:00Z",
    viewPermission: ViewPermission.BySlug,
};
const slugConflict = () =>
    new UniqueConstraintError("slug", "Slug is taken", new Error());

describe("BoardsService", () => {
    beforeEach(() => {
        vi.mocked(randomSuffix).mockReset().mockReturnValue("suffix");
        vi.spyOn(BoardsStore, "createWithInitialToken").mockResolvedValue({
            ...board,
            token: "token-a",
        });
        vi.spyOn(BoardsStore, "findBySlug").mockResolvedValue(board);
        vi.spyOn(BoardsStore, "findById").mockResolvedValue(board);
        vi.spyOn(BoardTokensStore, "findByBoardIdAndToken").mockResolvedValue({
            boardId: board.id,
            createdAt: board.createdAt,
            id: "token-id",
            token: "token-a",
            updatedAt: board.updatedAt,
        });
        vi.spyOn(BoardsStore, "delete").mockResolvedValue();
        vi.spyOn(BoardsStore, "update").mockResolvedValue({
            ...board,
            name: "Updated",
        });
    });
    afterEach(() => vi.restoreAllMocks());

    describe("insert", () => {
        it("retries the whole transaction with a suffix after a slug collision", async () => {
            vi.mocked(BoardsStore.createWithInitialToken).mockRejectedValueOnce(
                slugConflict()
            );
            vi.mocked(randomSuffix).mockReturnValue("abc123");
            const input = { name: board.name, slug: board.slug };

            const result = await BoardsService.insert(input);

            expect(BoardsStore.createWithInitialToken).toHaveBeenCalledTimes(2);
            expect(BoardsStore.createWithInitialToken).toHaveBeenLastCalledWith(
                {
                    name: board.name,
                    slug: "drums-abc123",
                    viewPermission: ViewPermission.BySlug,
                }
            );
            expect(result.token).toBe("token-a");
        });

        it("stops after the maximum number of slug collision retries", async () => {
            vi.mocked(BoardsStore.createWithInitialToken).mockRejectedValue(
                slugConflict()
            );
            const input = { name: board.name, slug: board.slug };

            const result = BoardsService.insert(input);

            await expect(result).rejects.toBeInstanceOf(UniqueConstraintError);
            expect(BoardsStore.createWithInitialToken).toHaveBeenCalledTimes(
                BoardsService.MAX_CREATE_ATTEMPTS + 1
            );
        });
        it("does not retry conflicts on fields other than slug", async () => {
            const error = new UniqueConstraintError(
                "token",
                "Token is taken",
                new Error()
            );
            vi.mocked(BoardsStore.createWithInitialToken).mockRejectedValue(
                error
            );
            const input = { name: board.name, slug: board.slug };

            const result = BoardsService.insert(input);

            await expect(result).rejects.toBe(error);
            expect(BoardsStore.createWithInitialToken).toHaveBeenCalledTimes(1);
        });

        it("does not retry unknown failures with an ambiguous write outcome", async () => {
            const error = new Error("Connection lost");
            vi.mocked(BoardsStore.createWithInitialToken).mockRejectedValue(
                error
            );
            const input = { name: board.name, slug: board.slug };

            const result = BoardsService.insert(input);

            await expect(result).rejects.toBe(error);
            expect(BoardsStore.createWithInitialToken).toHaveBeenCalledTimes(1);
        });
    });

    describe("get", () => {
        it("ignores an invalid token when the board can be read by slug", async () => {
            const token = "invalid";

            const result = await BoardsService.get(board.slug, token);

            expect(result).toEqual(board);
            expect(
                BoardTokensStore.findByBoardIdAndToken
            ).not.toHaveBeenCalled();
        });

        it("requires a token for a protected board", async () => {
            vi.mocked(BoardsStore.findBySlug).mockResolvedValue({
                ...board,
                viewPermission: ViewPermission.ByToken,
            });

            const result = BoardsService.get(board.slug);

            await expect(result).rejects.toBe(BOARD_NOT_FOUND_ERROR);
            expect(
                BoardTokensStore.findByBoardIdAndToken
            ).not.toHaveBeenCalled();
        });

        it("conceals a protected board when its token is invalid", async () => {
            vi.mocked(BoardsStore.findBySlug).mockResolvedValue({
                ...board,
                viewPermission: ViewPermission.ByToken,
            });
            vi.mocked(BoardTokensStore.findByBoardIdAndToken).mockResolvedValue(
                null
            );

            const result = BoardsService.get(board.slug, "invalid");

            await expect(result).rejects.toBe(BOARD_NOT_FOUND_ERROR);
            expect(BoardTokensStore.findByBoardIdAndToken).toHaveBeenCalledWith(
                board.id,
                "invalid"
            );
        });

        it("returns a protected board when its token is valid", async () => {
            const protectedBoard = {
                ...board,
                viewPermission: ViewPermission.ByToken,
            };
            vi.mocked(BoardsStore.findBySlug).mockResolvedValue(protectedBoard);

            const result = await BoardsService.get(board.slug, "token-a");

            expect(result).toEqual(protectedBoard);
            expect(BoardTokensStore.findByBoardIdAndToken).toHaveBeenCalledWith(
                board.id,
                "token-a"
            );
        });

        it("conceals a missing board", async () => {
            vi.mocked(BoardsStore.findBySlug).mockResolvedValue(null);

            const result = BoardsService.get("missing");

            await expect(result).rejects.toBe(BOARD_NOT_FOUND_ERROR);
            expect(
                BoardTokensStore.findByBoardIdAndToken
            ).not.toHaveBeenCalled();
        });

        it("rejects slug-only reads of a protected board", async () => {
            vi.mocked(BoardsStore.findBySlug).mockResolvedValue({
                ...board,
                viewPermission: ViewPermission.ByToken,
            });

            const result = BoardsService.getBySlug(board.slug);

            await expect(result).rejects.toBe(BOARD_NOT_FOUND_ERROR);
        });
    });

    describe("update", () => {
        it("updates the authorized board even if its old slug is reassigned", async () => {
            vi.mocked(BoardsStore.findBySlug)
                .mockReset()
                .mockResolvedValueOnce(board)
                .mockResolvedValue({ ...board, id: "board-b" });
            const input = {
                name: "Updated",
                originalSlug: board.slug,
                token: "token-a",
            };

            const result = await BoardsService.update(input);

            expect(result).toMatchObject({ id: board.id, name: "Updated" });
            expect(BoardsStore.update).toHaveBeenCalledExactlyOnceWith(
                board.id,
                {
                    name: "Updated",
                }
            );
        });
    });

    describe("delete", () => {
        it("deletes the authorized board by ID and delegates cascading to persistence", async () => {
            const token = "token-a";

            const result = await BoardsService.delete(board.slug, token);

            expect(result).toBe(true);
            expect(BoardsStore.delete).toHaveBeenCalledExactlyOnceWith(
                board.id
            );
        });

        it("leaves all records untouched when authorization fails", async () => {
            vi.mocked(BoardsStore.findBySlug)
                .mockReset()
                .mockResolvedValue(null);

            const result = BoardsService.delete(board.slug, "invalid");

            await expect(result).rejects.toBe(BOARD_NOT_FOUND_ERROR);
            expect(BoardsStore.delete).not.toHaveBeenCalled();
        });

        it("propagates deletion failure without separately removing tokens", async () => {
            const error = new Error("Cascade failed");
            vi.mocked(BoardsStore.delete).mockRejectedValue(error);

            const result = BoardsService.delete(board.slug, "token-a");

            await expect(result).rejects.toBe(error);
            expect(BoardsStore.delete).toHaveBeenCalledExactlyOnceWith(
                board.id
            );
        });
    });
});
