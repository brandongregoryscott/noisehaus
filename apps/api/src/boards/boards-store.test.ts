import { ViewPermission } from "common";
import { afterEach, assert, beforeEach, describe, expect, it, vi } from "vitest";
import { BoardsStore } from "@/boards/boards-store";
import { PocketBaseHttpError, PocketBaseClient } from "@/pocketbase-client";

const board = {
    id: "board-a",
    name: "Drums",
    slug: "drums",
    viewPermission: ViewPermission.BySlug,
};
describe("BoardsStore", () => {
    beforeEach(() => {
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
            const input = {
                name: board.name,
                slug: board.slug,
                viewPermission: ViewPermission.BySlug,
            };

            const result = await BoardsStore.createWithInitialToken(input);

            assert(result.isOk);
            expect(result.value).toMatchObject({
                ...board,
                token: "token-a",
            });
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

        it.each([
            [
                400,
                { data: { slug: { code: "validation_not_unique" } } },
                "unique-constraint",
            ],
            [400, { message: "Invalid board" }, "validation"],
            [503, "Unavailable", "persistence"],
        ])(
            "returns a typed result for provider failure %s %j",
            async (status, data, kind) => {
                const cause = new PocketBaseHttpError(
                    status as number,
                    data,
                    "POST",
                    "/api/batch"
                );
                vi.mocked(PocketBaseClient.createRecords).mockRejectedValue(
                    cause
                );

                const result = await BoardsStore.createWithInitialToken({
                    ...board,
                });

                assert(result.isErr);
                expect(result.error.kind).toBe(kind);
                expect(result.error.cause).toBe(cause);
                expect(PocketBaseClient.createRecords).toHaveBeenCalledTimes(1);
            }
        );

        it("rejects malformed successful batches as unexpected failures", async () => {
            vi.mocked(PocketBaseClient.createRecords).mockResolvedValue([]);

            await expect(
                BoardsStore.createWithInitialToken({ ...board })
            ).rejects.toThrow("'board creation result' was unexpectedly null.");
        });

        it("propagates a failed batch without retrying individual writes", async () => {
            const error = new Error("Token creation failed");
            vi.mocked(PocketBaseClient.createRecords).mockRejectedValue(error);
            const input = {
                name: board.name,
                slug: board.slug,
                viewPermission: ViewPermission.BySlug,
            };

            const result = BoardsStore.createWithInitialToken(input);

            await expect(result).rejects.toBe(error);
            expect(PocketBaseClient.createRecords).toHaveBeenCalledTimes(1);
            expect(PocketBaseClient.createRecord).not.toHaveBeenCalled();
            expect(PocketBaseClient.deleteRecord).not.toHaveBeenCalled();
        });
    });
});
