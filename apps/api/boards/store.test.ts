import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    getSupabaseQueryCalls,
    queueSingleResult,
    queueThrowOnError,
    resetSupabaseClientMock,
} from "../test/mocks/supabase-client";

const { mockBoardTokenInsert } = vi.hoisted(() => ({
    mockBoardTokenInsert: vi.fn(),
}));

vi.mock("../board-tokens/store", () => ({
    BoardTokensStore: {
        unsafe__insert: mockBoardTokenInsert,
    },
}));

vi.mock("../utilities/string-utils", () => ({
    randomSuffix: vi.fn(),
}));

import { randomSuffix } from "../utilities/string-utils";
import { BoardsStore } from "./store";

const uniqueConstraintError = {
    code: "23505",
    details: "",
    hint: "",
    message: "duplicate key value violates unique constraint",
};

describe("BoardsStore", () => {
    describe("insert", () => {
        beforeEach(() => {
            resetSupabaseClientMock();
            mockBoardTokenInsert.mockReset();
            vi.mocked(randomSuffix).mockReset();
        });

        it("inserts a board and returns the created token", async () => {
            queueSingleResult({ id: "board-1", name: "Drums", slug: "drums" });
            mockBoardTokenInsert.mockResolvedValue({ token: "token-1" });

            const result = await BoardsStore.insert({
                name: "Drums",
                slug: "drums",
            });

            expect(
                getSupabaseQueryCalls()
                    .filter(
                        (call) =>
                            call.table === "board" && call.method === "insert"
                    )
                    .map((call) => call.args[0])
            ).toEqual([{ name: "Drums", slug: "drums" }]);
            expect(mockBoardTokenInsert).toHaveBeenCalledWith(
                "drums",
                "board-1"
            );
            expect(result).toEqual({
                id: "board-1",
                name: "Drums",
                slug: "drums",
                token: "token-1",
            });
        });

        it("retries with a random suffix after a unique constraint error", async () => {
            queueThrowOnError(uniqueConstraintError);
            queueSingleResult({
                id: "board-2",
                name: "Drums",
                slug: "drums-abc123",
            });
            vi.mocked(randomSuffix).mockReturnValue("abc123");
            mockBoardTokenInsert.mockResolvedValue({ token: "token-2" });

            const result = await BoardsStore.insert({
                name: "Drums",
                slug: "drums",
            });

            expect(
                getSupabaseQueryCalls()
                    .filter(
                        (call) =>
                            call.table === "board" && call.method === "insert"
                    )
                    .map((call) => call.args[0])
            ).toEqual([
                { name: "Drums", slug: "drums" },
                { name: "Drums", slug: "drums-abc123" },
            ]);
            expect(mockBoardTokenInsert).toHaveBeenCalledWith(
                "drums-abc123",
                "board-2"
            );
            expect(result.token).toBe("token-2");
        });

        it("throws after max unique-constraint retries", async () => {
            for (let i = 0; i < BoardsStore.MAX_CREATE_ATTEMPTS + 1; i += 1) {
                queueThrowOnError(uniqueConstraintError);
            }

            vi.mocked(randomSuffix)
                .mockReturnValueOnce("a")
                .mockReturnValueOnce("b")
                .mockReturnValueOnce("c")
                .mockReturnValueOnce("d")
                .mockReturnValueOnce("e");

            await expect(
                BoardsStore.insert({ name: "Drums", slug: "drums" })
            ).rejects.toEqual(uniqueConstraintError);

            expect(
                getSupabaseQueryCalls()
                    .filter(
                        (call) =>
                            call.table === "board" && call.method === "insert"
                    )
                    .map((call) => call.args[0])
            ).toEqual([
                { name: "Drums", slug: "drums" },
                { name: "Drums", slug: "drums-a" },
                { name: "Drums", slug: "drums-b" },
                { name: "Drums", slug: "drums-c" },
                { name: "Drums", slug: "drums-d" },
                { name: "Drums", slug: "drums-e" },
            ]);
            expect(mockBoardTokenInsert).not.toHaveBeenCalled();
        });
    });
});
