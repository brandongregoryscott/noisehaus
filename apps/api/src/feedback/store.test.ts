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
            email: "a@example.com",
            feedback: "Nice work",
            id: "feedback-1",
        });

        await FeedbackStore.create({
            board_slug: "drums",
            email: "a@example.com",
            feedback: "Nice work",
        });

        expect(mockGetBoardBySlug).toHaveBeenCalledWith("drums");
        expect(
            getSupabaseQueryCalls()
                .filter(
                    (call) =>
                        call.table === "feedback" &&
                        call.method === "insert"
                )
                .map((call) => call.args[0])
        ).toEqual([
            {
                board_id: "board-1",
                board_slug: "drums",
                email: "a@example.com",
                feedback: "Nice work",
            },
        ]);
    });

    it("does not set board fields when board_slug is null", async () => {
        queueSingleResult({
            board_id: null,
            board_slug: null,
            email: "b@example.com",
            feedback: "Thanks",
            id: "feedback-2",
        });

        await FeedbackStore.create({
            board_id: "board-ignored",
            board_slug: null,
            email: "b@example.com",
            feedback: "Thanks",
        });

        expect(mockGetBoardBySlug).not.toHaveBeenCalled();
        expect(
            getSupabaseQueryCalls()
                .filter(
                    (call) =>
                        call.table === "feedback" &&
                        call.method === "insert"
                )
                .map((call) => call.args[0])
        ).toEqual([{ email: "b@example.com", feedback: "Thanks" }]);
    });

    it("does not set board fields when board_slug does not exist", async () => {
        mockGetBoardBySlug.mockResolvedValue(null);
        queueSingleResult({
            board_id: null,
            board_slug: null,
            email: "c@example.com",
            feedback: "Neat",
            id: "feedback-3",
        });

        await FeedbackStore.create({
            board_id: "board-ignored",
            board_slug: "missing",
            email: "c@example.com",
            feedback: "Neat",
        });

        expect(mockGetBoardBySlug).toHaveBeenCalledWith("missing");
        expect(
            getSupabaseQueryCalls()
                .filter(
                    (call) =>
                        call.table === "feedback" &&
                        call.method === "insert"
                )
                .map((call) => call.args[0])
        ).toEqual([{ email: "c@example.com", feedback: "Neat" }]);
    });
});
