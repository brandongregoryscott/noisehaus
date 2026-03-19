import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    getSupabaseQueryCalls,
    queueSingleResult,
    resetSupabaseClientMock,
} from "@/test/mocks/supabase-client";

const { mockGetBoardBySlug } = vi.hoisted(() => ({
    mockGetBoardBySlug: vi.fn(),
}));

vi.mock("../boards/store", () => ({
    BoardsStore: {
        unsafe__getBySlug: mockGetBoardBySlug,
    },
}));

import { FeedbackStore } from "@/feedback/store";

describe("FeedbackStore", () => {
    beforeEach(() => {
        resetSupabaseClientMock();
        mockGetBoardBySlug.mockReset();
    });

    it("sets board_id and board_slug when a matching board exists", async () => {
        mockGetBoardBySlug.mockResolvedValue({
            id: "board-1",
            slug: "drums",
        });
        queueSingleResult({
            board_id: "board-1",
            board_slug: "drums",
            comment: "Nice work",
            email: "a@example.com",
            id: "feedback-1",
        });

        await FeedbackStore.create({
            board_slug: "drums",
            comment: "Nice work",
            email: "a@example.com",
        });

        expect(mockGetBoardBySlug).toHaveBeenCalledWith("drums");
        expect(
            getSupabaseQueryCalls()
                .filter(
                    (call) =>
                        call.table === "feedback" && call.method === "insert"
                )
                .map((call) => call.args[0])
        ).toEqual([
            {
                board_id: "board-1",
                board_slug: "drums",
                comment: "Nice work",
                email: "a@example.com",
            },
        ]);
    });

    it("does not set board fields when board_slug is null", async () => {
        queueSingleResult({
            board_id: null,
            board_slug: null,
            comment: "Thanks",
            email: "b@example.com",
            id: "feedback-2",
        });

        await FeedbackStore.create({
            board_id: "board-ignored",
            board_slug: null,
            comment: "Thanks",
            email: "b@example.com",
        });

        expect(mockGetBoardBySlug).not.toHaveBeenCalled();
        expect(
            getSupabaseQueryCalls()
                .filter(
                    (call) =>
                        call.table === "feedback" && call.method === "insert"
                )
                .map((call) => call.args[0])
        ).toEqual([{ comment: "Thanks", email: "b@example.com" }]);
    });

    it("does not set board fields when board_slug does not exist", async () => {
        mockGetBoardBySlug.mockResolvedValue(null);
        queueSingleResult({
            board_id: null,
            board_slug: null,
            comment: "Neat",
            email: "c@example.com",
            id: "feedback-3",
        });

        await FeedbackStore.create({
            board_id: "board-ignored",
            board_slug: "missing",
            comment: "Neat",
            email: "c@example.com",
        });

        expect(mockGetBoardBySlug).toHaveBeenCalledWith("missing");
        expect(
            getSupabaseQueryCalls()
                .filter(
                    (call) =>
                        call.table === "feedback" && call.method === "insert"
                )
                .map((call) => call.args[0])
        ).toEqual([{ comment: "Neat", email: "c@example.com" }]);
    });
});
