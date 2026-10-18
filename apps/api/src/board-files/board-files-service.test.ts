import { MAXIMUM_BOARD_SIZE_IN_BYTES, ViewPermission } from "common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UploadedBoardFile } from "@/board-files/board-files-store";
import { BoardFilesService } from "@/board-files/board-files-service";
import { BoardFilesStore } from "@/board-files/board-files-store";
import { BoardsService } from "@/boards/boards-service";
import { BOARD_NOT_FOUND_ERROR } from "@/utilities/errors";

vi.mock("../boards/boards-service", () => ({
    BoardsService: {
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
    emoji: null,
    id: "file-a",
    position: 0,
    size: 10,
    updatedAt: board.updatedAt,
};

describe("BoardFilesService", () => {
    beforeEach(() => {
        vi.mocked(BoardsService.getBySlug).mockReset().mockResolvedValue(board);
        vi.mocked(BoardsService.getByToken)
            .mockReset()
            .mockResolvedValue(board);
        vi.spyOn(BoardFilesStore, "findById").mockResolvedValue(boardFile);
        vi.spyOn(BoardFilesStore, "update").mockResolvedValue({
            ...boardFile,
            displayName: "Updated",
        });
        vi.spyOn(BoardFilesStore, "delete").mockResolvedValue();
        vi.spyOn(BoardFilesStore, "bulkInsert").mockResolvedValue([boardFile]);
        vi.spyOn(BoardFilesStore, "listByBoardId").mockResolvedValue([]);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const expectNotFound = async (operation: Promise<unknown>) => {
        await expect(operation).rejects.toBe(BOARD_NOT_FOUND_ERROR);
        expect(BoardFilesStore.update).not.toHaveBeenCalled();
        expect(BoardFilesStore.delete).not.toHaveBeenCalled();
        expect(BoardFilesStore.bulkInsert).not.toHaveBeenCalled();
        expect(BoardFilesStore.listByBoardId).not.toHaveBeenCalled();
    };

    describe("update", () => {
        it("allows a file belonging to the authorized board", async () => {
            const options = {
                boardSlug: board.slug,
                displayName: "Updated",
                id: boardFile.id,
                token: "token-a",
            };

            const result = await BoardFilesService.update(options);

            expect(result).toMatchObject({
                displayName: "Updated",
                id: boardFile.id,
            });
            expect(BoardsService.getByToken).toHaveBeenCalledWith({
                slug: board.slug,
                token: "token-a",
            });
            expect(BoardFilesStore.update).toHaveBeenCalledWith(boardFile.id, {
                displayName: "Updated",
            });
        });

        it("checks only the size increase when replacing a sound", async () => {
            const file = {
                buffer: Buffer.from("replacement"),
                mimetype: "audio/wav",
                originalname: "new.wav",
                size: 15,
            };
            vi.mocked(BoardFilesStore.listByBoardId).mockResolvedValue([
                { ...boardFile, size: MAXIMUM_BOARD_SIZE_IN_BYTES - 5 },
            ]);
            const options = {
                boardSlug: board.slug,
                file,
                id: boardFile.id,
                token: "token-a",
            };

            await BoardFilesService.update(options);

            expect(BoardFilesStore.update).toHaveBeenCalledWith(boardFile.id, {
                file,
                size: 15,
            });
        });

        it("rejects an oversized replacement before writing metadata or audio", async () => {
            const file = {
                buffer: Buffer.from("replacement"),
                mimetype: "audio/wav",
                originalname: "new.wav",
                size: 16,
            };
            vi.mocked(BoardFilesStore.listByBoardId).mockResolvedValue([
                { ...boardFile, size: MAXIMUM_BOARD_SIZE_IN_BYTES - 5 },
            ]);
            const options = {
                boardSlug: board.slug,
                displayName: "Changed",
                file,
                id: boardFile.id,
                token: "token-a",
            };

            const result = BoardFilesService.update(options);

            await expect(result).rejects.toThrow("remaining size capacity");
            expect(BoardFilesStore.update).not.toHaveBeenCalled();
        });

        it("rejects a file belonging to another board", async () => {
            vi.mocked(BoardFilesStore.findById).mockResolvedValue({
                ...boardFile,
                boardId: "board-b",
            });
            const options = {
                boardSlug: board.slug,
                displayName: "Updated",
                id: boardFile.id,
                token: "token-a",
            };

            const result = BoardFilesService.update(options);

            await expectNotFound(result);
        });

        it("conceals missing files with the same access error", async () => {
            vi.mocked(BoardFilesStore.findById).mockResolvedValue(null);
            const options = {
                boardSlug: board.slug,
                displayName: "Updated",
                id: boardFile.id,
                token: "token-a",
            };

            const result = BoardFilesService.update(options);

            await expectNotFound(result);
        });

        it("stops before file lookup when board authorization fails", async () => {
            vi.mocked(BoardsService.getByToken).mockRejectedValue(
                BOARD_NOT_FOUND_ERROR
            );
            const options = {
                boardSlug: board.slug,
                displayName: "Updated",
                id: boardFile.id,
                token: "invalid",
            };

            const result = BoardFilesService.update(options);

            await expectNotFound(result);
            expect(BoardsService.getByToken).toHaveBeenCalledWith({
                slug: board.slug,
                token: "invalid",
            });
            expect(BoardFilesStore.findById).not.toHaveBeenCalled();
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

                const result = BoardFilesService.update(options);

                await expectNotFound(result);
                expect(BoardsService.getByToken).not.toHaveBeenCalled();
                expect(BoardFilesStore.findById).not.toHaveBeenCalled();
            }
        );

        it("rejects cross-board replacement before quota checks or writes", async () => {
            vi.mocked(BoardFilesStore.findById).mockResolvedValue({
                ...boardFile,
                boardId: "board-b",
            });
            const options = {
                boardSlug: board.slug,
                file: { size: 20 } as UploadedBoardFile,
                id: boardFile.id,
                token: "token-a",
            };

            const result = BoardFilesService.update(options);

            await expectNotFound(result);
        });
    });

    describe("delete", () => {
        it("allows a file belonging to the authorized board", async () => {
            const { id } = boardFile;
            const { slug } = board;
            const token = "token-a";

            const result = await BoardFilesService.delete(id, slug, token);

            expect(result).toBe(true);
            expect(BoardsService.getByToken).toHaveBeenCalledWith({
                slug,
                token,
            });
            expect(BoardFilesStore.delete).toHaveBeenCalledWith(id);
        });

        it("rejects a file belonging to another board", async () => {
            vi.mocked(BoardFilesStore.findById).mockResolvedValue({
                ...boardFile,
                boardId: "board-b",
            });
            const { id } = boardFile;
            const { slug } = board;
            const token = "token-a";

            const result = BoardFilesService.delete(id, slug, token);

            await expectNotFound(result);
        });

        it("conceals missing files with the same access error", async () => {
            vi.mocked(BoardFilesStore.findById).mockResolvedValue(null);
            const { id } = boardFile;
            const { slug } = board;
            const token = "token-a";

            const result = BoardFilesService.delete(id, slug, token);

            await expectNotFound(result);
        });

        it("stops before file lookup when board authorization fails", async () => {
            vi.mocked(BoardsService.getByToken).mockRejectedValue(
                BOARD_NOT_FOUND_ERROR
            );
            const { id } = boardFile;
            const { slug } = board;
            const token = "invalid";

            const result = BoardFilesService.delete(id, slug, token);

            await expectNotFound(result);
            expect(BoardsService.getByToken).toHaveBeenCalledWith({
                slug,
                token,
            });
            expect(BoardFilesStore.findById).not.toHaveBeenCalled();
        });

        it.each([undefined, null, "", 123, [], {}].map((token) => ({ token })))(
            "rejects a missing or malformed token ($token)",
            async ({ token }) => {
                const { id } = boardFile;
                const { slug } = board;

                const result = BoardFilesService.delete(
                    id,
                    slug,
                    token as string
                );

                await expectNotFound(result);
                expect(BoardsService.getByToken).not.toHaveBeenCalled();
                expect(BoardFilesStore.findById).not.toHaveBeenCalled();
            }
        );
    });

    describe("bulkInsert", () => {
        const file = {
            buffer: Buffer.from("sound"),
            mimetype: "audio/wav",
            originalname: "sound.wav",
            size: 5,
        } as UploadedBoardFile;

        it("creates all sounds in one transaction", async () => {
            const options = {
                boardSlug: board.slug,
                displayNames: ["First", "Second"],
                emojis: ["null", ":smile:"],
                files: [file, file],
                token: "token-a",
            };
            vi.mocked(BoardFilesStore.bulkInsert).mockResolvedValue([
                boardFile,
                { ...boardFile, id: "file-b" },
            ]);

            const result = await BoardFilesService.bulkInsert(options);

            expect(result.map((sound) => sound.id)).toEqual([
                boardFile.id,
                "file-b",
            ]);
            expect(BoardFilesStore.bulkInsert).toHaveBeenCalledTimes(1);
            expect(BoardFilesStore.bulkInsert).toHaveBeenCalledWith([
                {
                    boardId: board.id,
                    displayName: "First",
                    emoji: "",
                    file,
                    size: file.size,
                },
                {
                    boardId: board.id,
                    displayName: "Second",
                    emoji: ":smile:",
                    file,
                    size: file.size,
                },
            ]);
        });

        it("propagates a failed batch without retrying any individual sound", async () => {
            const error = new Error("Second sound failed");
            vi.mocked(BoardFilesStore.bulkInsert).mockRejectedValue(error);
            const options = {
                boardSlug: board.slug,
                displayNames: ["First", "Second"],
                emojis: ["null", "null"],
                files: [file, file],
                token: "token-a",
            };

            const result = BoardFilesService.bulkInsert(options);

            await expect(result).rejects.toBe(error);
            expect(BoardFilesStore.bulkInsert).toHaveBeenCalledTimes(1);
            expect(BoardFilesStore.delete).not.toHaveBeenCalled();
        });

        it("rejects uploads exceeding the remaining quota before writing", async () => {
            vi.mocked(BoardFilesStore.listByBoardId).mockResolvedValue([
                { ...boardFile, size: MAXIMUM_BOARD_SIZE_IN_BYTES - 4 },
            ]);
            const options = {
                boardSlug: board.slug,
                displayNames: ["Sound"],
                emojis: ["null"],
                files: [file],
                token: "token-a",
            };

            const result = BoardFilesService.bulkInsert(options);

            await expect(result).rejects.toThrow("remaining size capacity");
            expect(BoardFilesStore.bulkInsert).not.toHaveBeenCalled();
        });

        it("does not write when authorization fails", async () => {
            vi.mocked(BoardsService.getByToken).mockRejectedValue(
                BOARD_NOT_FOUND_ERROR
            );
            const options = {
                boardSlug: board.slug,
                displayNames: ["Sound"],
                emojis: ["null"],
                files: [file],
                token: "invalid",
            };

            const result = BoardFilesService.bulkInsert(options);

            await expectNotFound(result);
        });

        it("rejects mismatched file metadata before writing", async () => {
            const options = {
                boardSlug: board.slug,
                displayNames: [],
                emojis: ["null"],
                files: [file],
                token: "token-a",
            };

            const result = BoardFilesService.bulkInsert(options);

            await expect(result).rejects.toThrow("Each uploaded file");
            expect(BoardFilesStore.bulkInsert).not.toHaveBeenCalled();
        });
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

                const result = await BoardFilesService.get(options);

                expect(result).toMatchObject({
                    boardId: board.id,
                    id: boardFile.id,
                });
                expect(BoardsService.getBySlug).toHaveBeenCalledWith(
                    board.slug
                );
                expect(BoardsService.getByToken).not.toHaveBeenCalled();
            }
        );

        it("uses token authorization when a token is supplied", async () => {
            const options = {
                boardSlug: board.slug,
                id: boardFile.id,
                token: "token-a",
            };

            const result = await BoardFilesService.get(options);

            expect(result).toMatchObject({
                boardId: board.id,
                id: boardFile.id,
            });
            expect(BoardsService.getByToken).toHaveBeenCalledWith({
                slug: board.slug,
                token: "token-a",
            });
            expect(BoardsService.getBySlug).not.toHaveBeenCalled();
        });

        it.each([undefined, "invalid"])(
            "propagates denied board read permission (%s)",
            async (token) => {
                vi.mocked(BoardsService.getBySlug).mockRejectedValue(
                    BOARD_NOT_FOUND_ERROR
                );
                vi.mocked(BoardsService.getByToken).mockRejectedValue(
                    BOARD_NOT_FOUND_ERROR
                );
                const options = {
                    boardSlug: board.slug,
                    id: boardFile.id,
                    token,
                };

                const result = BoardFilesService.get(options);

                await expectNotFound(result);
                expect(BoardFilesStore.findById).not.toHaveBeenCalled();
            }
        );

        it.each([undefined, "token-a"])(
            "rejects cross-board reads (%s)",
            async (token) => {
                vi.mocked(BoardFilesStore.findById).mockResolvedValue({
                    ...boardFile,
                    boardId: "board-b",
                });
                const options = {
                    boardSlug: board.slug,
                    id: boardFile.id,
                    token,
                };

                const result = BoardFilesService.get(options);

                await expectNotFound(result);
            }
        );

        it("conceals missing files with the same access error", async () => {
            vi.mocked(BoardFilesStore.findById).mockResolvedValue(null);
            const options = { boardSlug: board.slug, id: boardFile.id };

            const result = BoardFilesService.get(options);

            await expectNotFound(result);
        });

        it("rejects malformed tokens before authorization or file lookup", async () => {
            const options = {
                boardSlug: board.slug,
                id: boardFile.id,
                token: ["token-a", "token-b"] as unknown as string,
            };

            const result = BoardFilesService.get(options);

            await expectNotFound(result);
            expect(BoardsService.getBySlug).not.toHaveBeenCalled();
            expect(BoardsService.getByToken).not.toHaveBeenCalled();
            expect(BoardFilesStore.findById).not.toHaveBeenCalled();
        });
    });
});
