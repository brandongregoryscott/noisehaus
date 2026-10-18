import { ViewPermission } from "common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MulterFile } from "@/storage/types";
import { BoardFilesStore } from "@/board-files/store";
import { BoardsStore } from "@/boards/store";
import { PocketBaseClient } from "@/pocketbase-client";
import { BOARD_NOT_FOUND_ERROR } from "@/utilities/errors";

vi.mock("../boards/store", () => ({
    BoardsStore: {
        getBySlug: vi.fn(),
        getByToken: vi.fn(),
    },
}));

const board = {
    createdAt: "2026-10-17T00:00:00Z",
    id: "board-a",
    name: "Board A",
    slug: "a",
    updatedAt: "2026-10-17T00:00:00Z",
    viewPermission: ViewPermission.BySlug,
};

const boardFile = {
    boardId: board.id,
    createdAt: board.createdAt,
    displayName: "Sound A",
    emoji: "",
    file: "sound-a.wav",
    id: "file-a",
    position: 0,
    size: 10,
    updatedAt: board.updatedAt,
};

describe("BoardFilesStore access", () => {
    beforeEach(() => {
        vi.mocked(BoardsStore.getBySlug).mockReset().mockResolvedValue(board);
        vi.mocked(BoardsStore.getByToken).mockReset().mockResolvedValue(board);
        vi.spyOn(PocketBaseClient, "getFirstRecordByFilter").mockResolvedValue(
            boardFile
        );
        vi.spyOn(PocketBaseClient, "updateRecord").mockResolvedValue({
            ...boardFile,
            displayName: "Updated",
        });
        vi.spyOn(PocketBaseClient, "deleteRecord").mockResolvedValue();
        vi.spyOn(PocketBaseClient, "listRecords").mockResolvedValue([]);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const expectNotFound = async (operation: Promise<unknown>) => {
        await expect(operation).rejects.toBe(BOARD_NOT_FOUND_ERROR);
        expect(PocketBaseClient.updateRecord).not.toHaveBeenCalled();
        expect(PocketBaseClient.deleteRecord).not.toHaveBeenCalled();
        expect(PocketBaseClient.listRecords).not.toHaveBeenCalled();
    };

    describe.each(["update", "delete"] as const)("%s", (operation) => {
        const mutate = (token: unknown) =>
            operation === "update"
                ? BoardFilesStore.update({
                      boardSlug: board.slug,
                      displayName: "Updated",
                      id: boardFile.id,
                      token: token as string,
                  })
                : BoardFilesStore.delete(
                      boardFile.id,
                      board.slug,
                      token as string
                  );

        it("allows a file belonging to the authorized board", async () => {
            const result = await mutate("token-a");
            expect(BoardsStore.getByToken).toHaveBeenCalledWith({
                slug: board.slug,
                token: "token-a",
            });
            if (operation === "update") {
                expect(result).toMatchObject({
                    displayName: "Updated",
                    id: boardFile.id,
                });
                expect(PocketBaseClient.updateRecord).toHaveBeenCalledWith(
                    "boardFiles",
                    boardFile.id,
                    { displayName: "Updated" }
                );
            } else {
                expect(result).toBe(true);
                expect(PocketBaseClient.deleteRecord).toHaveBeenCalledWith(
                    "boardFiles",
                    boardFile.id
                );
            }
        });

        it("rejects a file belonging to another board", async () => {
            vi.mocked(
                PocketBaseClient.getFirstRecordByFilter
            ).mockResolvedValue({ ...boardFile, boardId: "board-b" });
            await expectNotFound(mutate("token-a"));
        });

        it("conceals missing files with the same access error", async () => {
            vi.mocked(
                PocketBaseClient.getFirstRecordByFilter
            ).mockResolvedValue(null);
            await expectNotFound(mutate("token-a"));
        });

        it("stops before file lookup when board authorization fails", async () => {
            vi.mocked(BoardsStore.getByToken).mockRejectedValue(
                BOARD_NOT_FOUND_ERROR
            );
            await expectNotFound(mutate("invalid"));
            expect(BoardsStore.getByToken).toHaveBeenCalledWith({
                slug: board.slug,
                token: "invalid",
            });
            expect(
                PocketBaseClient.getFirstRecordByFilter
            ).not.toHaveBeenCalled();
        });

        it.each([undefined, null, "", 123, [], {}].map((token) => ({ token })))(
            "rejects a missing or malformed token ($token)",
            async ({ token }) => {
                await expectNotFound(mutate(token));
                expect(BoardsStore.getByToken).not.toHaveBeenCalled();
                expect(
                    PocketBaseClient.getFirstRecordByFilter
                ).not.toHaveBeenCalled();
            }
        );
    });

    it("rejects cross-board replacement before quota checks or writes", async () => {
        vi.mocked(PocketBaseClient.getFirstRecordByFilter).mockResolvedValue({
            ...boardFile,
            boardId: "board-b",
        });
        await expectNotFound(
            BoardFilesStore.update({
                boardSlug: board.slug,
                file: { size: 20 } as MulterFile,
                id: boardFile.id,
                token: "token-a",
            })
        );
    });

    describe("get", () => {
        it.each([undefined, ""])(
            "uses slug read permission without a token (%s)",
            async (token) => {
                const result = await BoardFilesStore.get({
                    boardSlug: board.slug,
                    id: boardFile.id,
                    token,
                });
                expect(result).toMatchObject({
                    boardId: board.id,
                    id: boardFile.id,
                });
                expect(BoardsStore.getBySlug).toHaveBeenCalledWith(board.slug);
                expect(BoardsStore.getByToken).not.toHaveBeenCalled();
            }
        );

        it("uses token authorization when a token is supplied", async () => {
            const result = await BoardFilesStore.get({
                boardSlug: board.slug,
                id: boardFile.id,
                token: "token-a",
            });
            expect(result).toMatchObject({
                boardId: board.id,
                id: boardFile.id,
            });
            expect(BoardsStore.getByToken).toHaveBeenCalledWith({
                slug: board.slug,
                token: "token-a",
            });
            expect(BoardsStore.getBySlug).not.toHaveBeenCalled();
        });

        it.each([undefined, "invalid"])(
            "propagates denied board read permission (%s)",
            async (token) => {
                vi.mocked(BoardsStore.getBySlug).mockRejectedValue(
                    BOARD_NOT_FOUND_ERROR
                );
                vi.mocked(BoardsStore.getByToken).mockRejectedValue(
                    BOARD_NOT_FOUND_ERROR
                );
                await expectNotFound(
                    BoardFilesStore.get({
                        boardSlug: board.slug,
                        id: boardFile.id,
                        token,
                    })
                );
                expect(
                    PocketBaseClient.getFirstRecordByFilter
                ).not.toHaveBeenCalled();
            }
        );

        it.each([undefined, "token-a"])(
            "rejects cross-board reads (%s)",
            async (token) => {
                vi.mocked(
                    PocketBaseClient.getFirstRecordByFilter
                ).mockResolvedValue({ ...boardFile, boardId: "board-b" });
                await expectNotFound(
                    BoardFilesStore.get({
                        boardSlug: board.slug,
                        id: boardFile.id,
                        token,
                    })
                );
            }
        );

        it("conceals missing files with the same access error", async () => {
            vi.mocked(
                PocketBaseClient.getFirstRecordByFilter
            ).mockResolvedValue(null);
            await expectNotFound(
                BoardFilesStore.get({ boardSlug: board.slug, id: boardFile.id })
            );
        });

        it("rejects malformed tokens before authorization or file lookup", async () => {
            await expectNotFound(
                BoardFilesStore.get({
                    boardSlug: board.slug,
                    id: boardFile.id,
                    token: ["token-a", "token-b"] as unknown as string,
                })
            );
            expect(BoardsStore.getBySlug).not.toHaveBeenCalled();
            expect(BoardsStore.getByToken).not.toHaveBeenCalled();
            expect(
                PocketBaseClient.getFirstRecordByFilter
            ).not.toHaveBeenCalled();
        });
    });
});
