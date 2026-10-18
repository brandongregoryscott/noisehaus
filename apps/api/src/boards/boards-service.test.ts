import {
    ViewPermission,
    BOARD_NOT_FOUND_ERROR,
    UniqueConstraintError,
    PersistenceError,
    ValidationError,
    ok,
    err,
} from "common";
import {
    afterEach,
    assert,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";
import { BoardTokensStore } from "@/board-tokens/board-tokens-store";
import { BoardsService } from "@/boards/boards-service";
import { BoardsStore } from "@/boards/boards-store";
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
        vi.spyOn(BoardsStore, "createWithInitialToken").mockResolvedValue(
            ok({
                ...board,
                token: "token-a",
            })
        );
        vi.spyOn(BoardsStore, "findBySlug").mockResolvedValue(ok(board));
        vi.spyOn(BoardsStore, "findById").mockResolvedValue(ok(board));
        vi.spyOn(BoardTokensStore, "findByBoardIdAndToken").mockResolvedValue(
            ok({
                boardId: board.id,
                createdAt: board.createdAt,
                id: "token-id",
                token: "token-a",
                updatedAt: board.updatedAt,
            })
        );
        vi.spyOn(BoardsStore, "delete").mockResolvedValue(ok(undefined));
        vi.spyOn(BoardsStore, "update").mockResolvedValue(
            ok({
                ...board,
                name: "Updated",
            })
        );
    });
    afterEach(() => vi.restoreAllMocks());

    describe("insert", () => {
        it("retries the whole transaction with a suffix after a slug collision", async () => {
            vi.mocked(BoardsStore.createWithInitialToken).mockResolvedValueOnce(
                err(slugConflict())
            );
            vi.mocked(randomSuffix).mockReturnValue("abc123");
            const input = { name: board.name, slug: board.slug };

            const result = await BoardsService.insert(input);

            assert(result.isOk);

            expect(BoardsStore.createWithInitialToken).toHaveBeenCalledTimes(2);
            expect(BoardsStore.createWithInitialToken).toHaveBeenLastCalledWith(
                {
                    name: board.name,
                    slug: "drums-abc123",
                    viewPermission: ViewPermission.BySlug,
                }
            );
            expect(result.value.token).toBe("token-a");
        });

        it("stops after the maximum number of slug collision retries", async () => {
            vi.mocked(BoardsStore.createWithInitialToken).mockResolvedValue(
                err(slugConflict())
            );
            const input = { name: board.name, slug: board.slug };

            const result = await BoardsService.insert(input);

            assert(result.isUniqueConstraintError("slug"));
            expect(result.error.field).toBe("slug");
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
            vi.mocked(BoardsStore.createWithInitialToken).mockResolvedValue(
                err(error)
            );
            const input = { name: board.name, slug: board.slug };

            const result = await BoardsService.insert(input);

            assert(result.isErr);
            expect(result.error).toBe(error);
            expect(BoardsStore.createWithInitialToken).toHaveBeenCalledTimes(1);
        });

        it.each([
            new PersistenceError(new Error("Ambiguous write outcome")),
            new ValidationError("Invalid board"),
        ])("returns $kind failures without retrying", async (error) => {
            vi.mocked(BoardsStore.createWithInitialToken).mockResolvedValue(
                err(error)
            );

            const result = await BoardsService.insert({
                name: board.name,
                slug: board.slug,
            });

            assert(result.isErr);
            expect(result.error).toBe(error);
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

            assert(result.isOk);

            expect(result.value).toEqual(board);
            expect(
                BoardTokensStore.findByBoardIdAndToken
            ).not.toHaveBeenCalled();
        });

        it("requires a token for a protected board", async () => {
            vi.mocked(BoardsStore.findBySlug).mockResolvedValue(
                ok({
                    ...board,
                    viewPermission: ViewPermission.ByToken,
                })
            );

            const result = await BoardsService.get(board.slug);
            assert(result.isNotFoundError());
            expect(result.error).toBe(BOARD_NOT_FOUND_ERROR);
            expect(
                BoardTokensStore.findByBoardIdAndToken
            ).not.toHaveBeenCalled();
        });

        it("conceals a protected board when its token is invalid", async () => {
            vi.mocked(BoardsStore.findBySlug).mockResolvedValue(
                ok({
                    ...board,
                    viewPermission: ViewPermission.ByToken,
                })
            );
            vi.mocked(BoardTokensStore.findByBoardIdAndToken).mockResolvedValue(
                ok(null)
            );

            const result = await BoardsService.get(board.slug, "invalid");
            assert(result.isNotFoundError());
            expect(result.error).toBe(BOARD_NOT_FOUND_ERROR);
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
            vi.mocked(BoardsStore.findBySlug).mockResolvedValue(
                ok(protectedBoard)
            );

            const result = await BoardsService.get(board.slug, "token-a");

            assert(result.isOk);

            expect(result.value).toEqual(protectedBoard);
            expect(BoardTokensStore.findByBoardIdAndToken).toHaveBeenCalledWith(
                board.id,
                "token-a"
            );
        });

        it("conceals a missing board", async () => {
            vi.mocked(BoardsStore.findBySlug).mockResolvedValue(ok(null));

            const result = await BoardsService.get("missing");
            assert(result.isNotFoundError());
            expect(result.error).toBe(BOARD_NOT_FOUND_ERROR);
            expect(
                BoardTokensStore.findByBoardIdAndToken
            ).not.toHaveBeenCalled();
        });

        it("rejects slug-only reads of a protected board", async () => {
            vi.mocked(BoardsStore.findBySlug).mockResolvedValue(
                ok({
                    ...board,
                    viewPermission: ViewPermission.ByToken,
                })
            );

            const result = await BoardsService.getBySlug(board.slug);
            assert(result.isNotFoundError());
            expect(result.error).toBe(BOARD_NOT_FOUND_ERROR);
        });
    });

    describe("update", () => {
        it("updates the authorized board even if its old slug is reassigned", async () => {
            vi.mocked(BoardsStore.findBySlug)
                .mockReset()
                .mockResolvedValueOnce(ok(board))
                .mockResolvedValue(ok({ ...board, id: "board-b" }));
            const input = {
                name: "Updated",
                originalSlug: board.slug,
                token: "token-a",
            };

            const result = await BoardsService.update(input);

            assert(result.isOk);

            expect(result.value).toMatchObject({
                id: board.id,
                name: "Updated",
            });
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

            assert(result.isOk);

            expect(result.value).toBe(true);
            expect(BoardsStore.delete).toHaveBeenCalledExactlyOnceWith(
                board.id
            );
        });

        it("leaves all records untouched when authorization fails", async () => {
            vi.mocked(BoardsStore.findBySlug)
                .mockReset()
                .mockResolvedValue(ok(null));

            const result = await BoardsService.delete(board.slug, "invalid");
            assert(result.isNotFoundError());
            expect(result.error).toBe(BOARD_NOT_FOUND_ERROR);
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
    describe("failure propagation", () => {
        it("preserves persistence failures without treating them as missing boards", async () => {
            const error = new PersistenceError(
                new Error("Provider unavailable")
            );
            const testCases = [
                { name: "get", operation: () => BoardsService.get(board.slug) },
                {
                    name: "getBySlug",
                    operation: () => BoardsService.getBySlug(board.slug),
                },
                {
                    name: "getByToken",
                    operation: () =>
                        BoardsService.getByToken({
                            slug: board.slug,
                            token: "token-a",
                        }),
                },
                {
                    name: "update",
                    operation: () =>
                        BoardsService.update({
                            name: "Updated",
                            originalSlug: board.slug,
                            token: "token-a",
                        }),
                },
                {
                    name: "delete",
                    operation: () =>
                        BoardsService.delete(board.slug, "token-a"),
                },
            ];
            vi.mocked(BoardsStore.findBySlug).mockResolvedValue(err(error));
            for (const { name, operation } of testCases) {
                const result = await operation();
                assert(result.isPersistenceError(), name);
                expect(result.error, name).toBe(error);
            }
            expect(
                BoardTokensStore.findByBoardIdAndToken
            ).not.toHaveBeenCalled();
            expect(BoardsStore.update).not.toHaveBeenCalled();
            expect(BoardsStore.delete).not.toHaveBeenCalled();
        });

        it("stops writes when token lookup fails", async () => {
            const error = new PersistenceError(
                new Error("Token lookup failed")
            );
            vi.mocked(BoardTokensStore.findByBoardIdAndToken).mockResolvedValue(
                err(error)
            );
            const result = await BoardsService.update({
                name: "Updated",
                originalSlug: board.slug,
                token: "token-a",
            });
            assert(result.isPersistenceError());
            expect(result.error).toBe(error);
            expect(BoardsStore.update).not.toHaveBeenCalled();
        });

        it("returns validation when token authorization has neither id nor slug", async () => {
            const result = await BoardsService.getByToken({ token: "token-a" });
            assert(result.isValidationError());
            expect(BoardsStore.findBySlug).not.toHaveBeenCalled();
            expect(BoardsStore.findById).not.toHaveBeenCalled();
        });

        it("returns a failed delete without reporting success", async () => {
            const error = new PersistenceError(new Error("Delete failed"));
            vi.mocked(BoardsStore.delete).mockResolvedValue(err(error));
            const result = await BoardsService.delete(board.slug, "token-a");
            assert(result.isPersistenceError());
            expect(result.error).toBe(error);
        });
    });
});
