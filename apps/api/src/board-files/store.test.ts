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

    describe("update", () => {
        it("allows a file belonging to the authorized board", async () => {
            const options = {
                boardSlug: board.slug,
                displayName: "Updated",
                id: boardFile.id,
                token: "token-a",
            };

            const result = await BoardFilesStore.update(options);

            expect(result).toMatchObject({
                displayName: "Updated",
                id: boardFile.id,
            });
            expect(BoardsStore.getByToken).toHaveBeenCalledWith({
                slug: board.slug,
                token: "token-a",
            });
            expect(PocketBaseClient.updateRecord).toHaveBeenCalledWith(
                "boardFiles",
                boardFile.id,
                { displayName: "Updated" }
            );
        });

        it("rejects a file belonging to another board", async () => {
            vi.mocked(
                PocketBaseClient.getFirstRecordByFilter
            ).mockResolvedValue({ ...boardFile, boardId: "board-b" });
            const options = {
                boardSlug: board.slug,
                displayName: "Updated",
                id: boardFile.id,
                token: "token-a",
            };

            const result = BoardFilesStore.update(options);

            await expectNotFound(result);
        });

        it("conceals missing files with the same access error", async () => {
            vi.mocked(
                PocketBaseClient.getFirstRecordByFilter
            ).mockResolvedValue(null);
            const options = {
                boardSlug: board.slug,
                displayName: "Updated",
                id: boardFile.id,
                token: "token-a",
            };

            const result = BoardFilesStore.update(options);

            await expectNotFound(result);
        });

        it("stops before file lookup when board authorization fails", async () => {
            vi.mocked(BoardsStore.getByToken).mockRejectedValue(
                BOARD_NOT_FOUND_ERROR
            );
            const options = {
                boardSlug: board.slug,
                displayName: "Updated",
                id: boardFile.id,
                token: "invalid",
            };

            const result = BoardFilesStore.update(options);

            await expectNotFound(result);
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
                const options = {
                    boardSlug: board.slug,
                    displayName: "Updated",
                    id: boardFile.id,
                    token: token as string,
                };

                const result = BoardFilesStore.update(options);

                await expectNotFound(result);
                expect(BoardsStore.getByToken).not.toHaveBeenCalled();
                expect(
                    PocketBaseClient.getFirstRecordByFilter
                ).not.toHaveBeenCalled();
            }
        );

        it("rejects cross-board replacement before quota checks or writes", async () => {
            vi.mocked(
                PocketBaseClient.getFirstRecordByFilter
            ).mockResolvedValue({ ...boardFile, boardId: "board-b" });
            const options = {
                boardSlug: board.slug,
                file: { size: 20 } as MulterFile,
                id: boardFile.id,
                token: "token-a",
            };

            const result = BoardFilesStore.update(options);

            await expectNotFound(result);
        });
    });

    describe("delete", () => {
        it("allows a file belonging to the authorized board", async () => {
            const { id } = boardFile;
            const { slug } = board;
            const token = "token-a";

            const result = await BoardFilesStore.delete(id, slug, token);

            expect(result).toBe(true);
            expect(BoardsStore.getByToken).toHaveBeenCalledWith({
                slug,
                token,
            });
            expect(PocketBaseClient.deleteRecord).toHaveBeenCalledWith(
                "boardFiles",
                id
            );
        });

        it("rejects a file belonging to another board", async () => {
            vi.mocked(
                PocketBaseClient.getFirstRecordByFilter
            ).mockResolvedValue({ ...boardFile, boardId: "board-b" });
            const { id } = boardFile;
            const { slug } = board;
            const token = "token-a";

            const result = BoardFilesStore.delete(id, slug, token);

            await expectNotFound(result);
        });

        it("conceals missing files with the same access error", async () => {
            vi.mocked(
                PocketBaseClient.getFirstRecordByFilter
            ).mockResolvedValue(null);
            const { id } = boardFile;
            const { slug } = board;
            const token = "token-a";

            const result = BoardFilesStore.delete(id, slug, token);

            await expectNotFound(result);
        });

        it("stops before file lookup when board authorization fails", async () => {
            vi.mocked(BoardsStore.getByToken).mockRejectedValue(
                BOARD_NOT_FOUND_ERROR
            );
            const { id } = boardFile;
            const { slug } = board;
            const token = "invalid";

            const result = BoardFilesStore.delete(id, slug, token);

            await expectNotFound(result);
            expect(BoardsStore.getByToken).toHaveBeenCalledWith({
                slug,
                token,
            });
            expect(
                PocketBaseClient.getFirstRecordByFilter
            ).not.toHaveBeenCalled();
        });

        it.each([undefined, null, "", 123, [], {}].map((token) => ({ token })))(
            "rejects a missing or malformed token ($token)",
            async ({ token }) => {
                const { id } = boardFile;
                const { slug } = board;

                const result = BoardFilesStore.delete(
                    id,
                    slug,
                    token as string
                );

                await expectNotFound(result);
                expect(BoardsStore.getByToken).not.toHaveBeenCalled();
                expect(
                    PocketBaseClient.getFirstRecordByFilter
                ).not.toHaveBeenCalled();
            }
        );
    });

    describe("get", () => {
        it.each([undefined, ""])(
            "uses slug read permission without a token (%s)",
            async (token) => {
                const options = {
                    boardSlug: board.slug,
                    id: boardFile.id,
                    token,
                };

                const result = await BoardFilesStore.get(options);

                expect(result).toMatchObject({
                    boardId: board.id,
                    id: boardFile.id,
                });
                expect(BoardsStore.getBySlug).toHaveBeenCalledWith(board.slug);
                expect(BoardsStore.getByToken).not.toHaveBeenCalled();
            }
        );

        it("uses token authorization when a token is supplied", async () => {
            const options = {
                boardSlug: board.slug,
                id: boardFile.id,
                token: "token-a",
            };

            const result = await BoardFilesStore.get(options);

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
                const options = {
                    boardSlug: board.slug,
                    id: boardFile.id,
                    token,
                };

                const result = BoardFilesStore.get(options);

                await expectNotFound(result);
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
                const options = {
                    boardSlug: board.slug,
                    id: boardFile.id,
                    token,
                };

                const result = BoardFilesStore.get(options);

                await expectNotFound(result);
            }
        );

        it("conceals missing files with the same access error", async () => {
            vi.mocked(
                PocketBaseClient.getFirstRecordByFilter
            ).mockResolvedValue(null);
            const options = { boardSlug: board.slug, id: boardFile.id };

            const result = BoardFilesStore.get(options);

            await expectNotFound(result);
        });

        it("rejects malformed tokens before authorization or file lookup", async () => {
            const options = {
                boardSlug: board.slug,
                id: boardFile.id,
                token: ["token-a", "token-b"] as unknown as string,
            };

            const result = BoardFilesStore.get(options);

            await expectNotFound(result);
            expect(BoardsStore.getBySlug).not.toHaveBeenCalled();
            expect(BoardsStore.getByToken).not.toHaveBeenCalled();
            expect(
                PocketBaseClient.getFirstRecordByFilter
            ).not.toHaveBeenCalled();
        });
    });
});
