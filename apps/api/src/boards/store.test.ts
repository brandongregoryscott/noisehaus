import { beforeEach, describe, expect, it, vi } from "vitest";

const {
    mockBoardTokenInsert,
    mockCreateRecord,
    mockEscapeFilterValue,
    mockPocketBaseUniqueError,
    PocketBaseHttpErrorClass,
} = vi.hoisted(() => {
    class PocketBaseHttpErrorClass extends Error {
        data: unknown;
        status: number;

        constructor(status: number, data: unknown) {
            super();
            this.status = status;
            this.data = data;
        }
    }

    return {
        mockBoardTokenInsert: vi.fn(),
        mockCreateRecord: vi.fn(),
        mockEscapeFilterValue: vi.fn((value: string) => `"${value}"`),
        mockPocketBaseUniqueError: () =>
            new PocketBaseHttpErrorClass(400, {
                data: {
                    slug: {
                        code: "validation_not_unique",
                    },
                },
            }),
        PocketBaseHttpErrorClass,
    };
});

vi.mock("../board-tokens/store", () => ({
    BoardTokensStore: {
        unsafe__insert: mockBoardTokenInsert,
    },
}));

vi.mock("../pocketbase-client", () => {
    return {
        PocketBaseClient: {
            createRecord: mockCreateRecord,
            escapeFilterValue: mockEscapeFilterValue,
            getFirstRecordByFilter: vi.fn(),
            listRecords: vi.fn(),
            updateRecord: vi.fn(),
        },
        PocketBaseHttpError: PocketBaseHttpErrorClass,
    };
});

vi.mock("../utilities/string-utils", () => ({
    randomSuffix: vi.fn(),
}));

import { BoardsStore } from "@/boards/store";
import { randomSuffix } from "@/utilities/string-utils";
import { ViewPermission } from "common";

describe("BoardsStore", () => {
    describe("insert", () => {
        beforeEach(() => {
            mockCreateRecord.mockReset();
            mockBoardTokenInsert.mockReset();
            vi.mocked(randomSuffix).mockReset();
        });

        it("inserts a board and returns the created token", async () => {
            mockCreateRecord.mockResolvedValue({
                id: "board-1",
                name: "Drums",
                slug: "drums",
            });
            mockBoardTokenInsert.mockResolvedValue({ token: "token-1" });

            const result = await BoardsStore.insert({
                name: "Drums",
                slug: "drums",
            });

            expect(mockCreateRecord).toHaveBeenCalledWith("boards", {
                name: "Drums",
                slug: "drums",
                viewPermission: ViewPermission.BySlug,
            });
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
            mockCreateRecord
                .mockRejectedValueOnce(mockPocketBaseUniqueError())
                .mockResolvedValueOnce({
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

            expect(mockCreateRecord).toHaveBeenNthCalledWith(1, "boards", {
                name: "Drums",
                slug: "drums",
                viewPermission: ViewPermission.BySlug,
            });
            expect(mockCreateRecord).toHaveBeenNthCalledWith(2, "boards", {
                name: "Drums",
                slug: "drums-abc123",
                viewPermission: ViewPermission.BySlug,
            });
            expect(mockBoardTokenInsert).toHaveBeenCalledWith(
                "drums-abc123",
                "board-2"
            );
            expect(result.token).toBe("token-2");
        });

        it("throws after max unique-constraint retries", async () => {
            for (let i = 0; i < BoardsStore.MAX_CREATE_ATTEMPTS + 1; i += 1) {
                mockCreateRecord.mockRejectedValueOnce(
                    mockPocketBaseUniqueError()
                );
            }

            vi.mocked(randomSuffix)
                .mockReturnValueOnce("a")
                .mockReturnValueOnce("b")
                .mockReturnValueOnce("c")
                .mockReturnValueOnce("d")
                .mockReturnValueOnce("e");

            await expect(
                BoardsStore.insert({ name: "Drums", slug: "drums" })
            ).rejects.toBeInstanceOf(Error);

            expect(mockCreateRecord).toHaveBeenCalledTimes(
                BoardsStore.MAX_CREATE_ATTEMPTS + 1
            );
            expect(mockBoardTokenInsert).not.toHaveBeenCalled();
        });
    });
});
