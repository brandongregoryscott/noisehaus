import { ViewPermission } from "common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BoardsStore } from "@/boards/store";
import { PocketBaseClient, PocketBaseHttpError } from "@/pocketbase-client";
import { BOARD_NOT_FOUND_ERROR } from "@/utilities/errors";
import { randomSuffix } from "@/utilities/string-utils";

vi.mock("../utilities/string-utils", () => ({ randomSuffix: vi.fn() }));

const board = {
    id: "board-a",
    name: "Drums",
    slug: "drums",
    viewPermission: ViewPermission.BySlug,
};
const slugConflict = () =>
    new PocketBaseHttpError(
        400,
        {
            data: { slug: { code: "validation_not_unique" } },
        },
        "POST",
        "/api/batch"
    );

describe("BoardsStore", () => {
    beforeEach(() => {
        vi.mocked(randomSuffix).mockReset().mockReturnValue("suffix");
        vi.spyOn(PocketBaseClient, "createRecords").mockResolvedValue([
            board,
            { token: "token-a" },
        ]);
        vi.spyOn(PocketBaseClient, "createRecord").mockResolvedValue(board);
        vi.spyOn(PocketBaseClient, "deleteRecord").mockResolvedValue();
        vi.spyOn(PocketBaseClient, "updateRecord").mockResolvedValue({
            ...board,
            name: "Updated",
        });
        vi.spyOn(PocketBaseClient, "getFirstRecordByFilter")
            .mockResolvedValueOnce(board)
            .mockResolvedValue({ token: "token-a" });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("insert", () => {
        it("creates the board and its token in one atomic operation", async () => {
            const input = { name: board.name, slug: board.slug };

            const result = await BoardsStore.insert(input);

            expect(result).toMatchObject({ ...board, token: "token-a" });
            expect(PocketBaseClient.createRecords).toHaveBeenCalledTimes(1);
            const [requests] = vi.mocked(PocketBaseClient.createRecords).mock
                .calls[0];
            expect(requests).toEqual([
                {
                    collection: "boards",
                    data: {
                        ...input,
                        id: expect.stringMatching(/^[a-f0-9]{15}$/),
                        viewPermission: ViewPermission.BySlug,
                    },
                },
                {
                    collection: "boardTokens",
                    data: {
                        boardId: expect.any(String),
                        token: expect.stringMatching(/^[a-f0-9]{8}$/),
                    },
                },
            ]);
            expect(requests[1].data).toMatchObject({
                boardId: (requests[0].data as Record<string, unknown>).id,
            });
            expect(PocketBaseClient.createRecord).not.toHaveBeenCalled();
        });

        it("propagates a failed batch without retrying individual writes", async () => {
            const error = new Error("Token creation failed");
            vi.mocked(PocketBaseClient.createRecords).mockRejectedValue(error);
            const input = { name: board.name, slug: board.slug };

            const result = BoardsStore.insert(input);

            await expect(result).rejects.toBe(error);
            expect(PocketBaseClient.createRecords).toHaveBeenCalledTimes(1);
            expect(PocketBaseClient.createRecord).not.toHaveBeenCalled();
            expect(PocketBaseClient.deleteRecord).not.toHaveBeenCalled();
        });

        it("retries the whole transaction with a suffix after a slug collision", async () => {
            vi.mocked(PocketBaseClient.createRecords).mockRejectedValueOnce(
                slugConflict()
            );
            vi.mocked(randomSuffix).mockReturnValue("abc123");
            const input = { name: board.name, slug: board.slug };

            const result = await BoardsStore.insert(input);

            expect(PocketBaseClient.createRecords).toHaveBeenCalledTimes(2);
            const [requests] = vi.mocked(PocketBaseClient.createRecords).mock
                .calls[1];
            expect(requests[0].data).toMatchObject({ slug: "drums-abc123" });
            expect(result.token).toBe("token-a");
        });

        it("stops after the maximum number of slug collision retries", async () => {
            vi.mocked(PocketBaseClient.createRecords).mockRejectedValue(
                slugConflict()
            );
            const input = { name: board.name, slug: board.slug };

            const result = BoardsStore.insert(input);

            await expect(result).rejects.toBeInstanceOf(PocketBaseHttpError);
            expect(PocketBaseClient.createRecords).toHaveBeenCalledTimes(
                BoardsStore.MAX_CREATE_ATTEMPTS + 1
            );
        });
    });

    describe("update", () => {
        it("updates the authorized board even if its old slug is reassigned", async () => {
            vi.mocked(PocketBaseClient.getFirstRecordByFilter)
                .mockReset()
                .mockResolvedValueOnce(board)
                .mockResolvedValueOnce({ boardId: board.id, token: "token-a" })
                .mockResolvedValue({ ...board, id: "board-b" });
            const input = {
                name: "Updated",
                originalSlug: board.slug,
                token: "token-a",
            };

            const result = await BoardsStore.update(input);

            expect(result).toMatchObject({ id: board.id, name: "Updated" });
            expect(
                PocketBaseClient.updateRecord
            ).toHaveBeenCalledExactlyOnceWith("boards", board.id, {
                name: "Updated",
            });
        });
    });

    describe("delete", () => {
        it("deletes the authorized board by ID and delegates cascading to persistence", async () => {
            const token = "token-a";

            const result = await BoardsStore.delete(board.slug, token);

            expect(result).toBe(true);
            expect(
                PocketBaseClient.deleteRecord
            ).toHaveBeenCalledExactlyOnceWith("boards", board.id);
        });

        it("leaves all records untouched when authorization fails", async () => {
            vi.mocked(PocketBaseClient.getFirstRecordByFilter)
                .mockReset()
                .mockResolvedValue(null);

            const result = BoardsStore.delete(board.slug, "invalid");

            await expect(result).rejects.toBe(BOARD_NOT_FOUND_ERROR);
            expect(PocketBaseClient.deleteRecord).not.toHaveBeenCalled();
        });

        it("propagates deletion failure without separately removing tokens", async () => {
            const error = new Error("Cascade failed");
            vi.mocked(PocketBaseClient.deleteRecord).mockRejectedValue(error);

            const result = BoardsStore.delete(board.slug, "token-a");

            await expect(result).rejects.toBe(error);
            expect(
                PocketBaseClient.deleteRecord
            ).toHaveBeenCalledExactlyOnceWith("boards", board.id);
        });
    });
});
