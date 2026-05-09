import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateRecord, mockGetBoardBySlug } = vi.hoisted(() => ({
    mockCreateRecord: vi.fn(),
    mockGetBoardBySlug: vi.fn(),
}));

vi.mock("../boards/store", () => ({
    BoardsStore: {
        unsafe__getBySlug: mockGetBoardBySlug,
    },
}));

vi.mock("../pocketbase-client", () => ({
    PocketBaseClient: {
        createRecord: mockCreateRecord,
    },
}));

import { FeedbackStore } from "@/feedback/store";

describe("FeedbackStore", () => {
    beforeEach(() => {
        mockCreateRecord.mockReset();
        mockGetBoardBySlug.mockReset();
    });

    it("sets boardId when a matching board exists", async () => {
        mockGetBoardBySlug.mockResolvedValue({
            id: "board-1",
            slug: "drums",
        });
        mockCreateRecord.mockResolvedValue({
            boardId: "board-1",
            comment: "Nice work",
            email: "a@example.com",
            id: "feedback-1",
        });

        await FeedbackStore.create({
            boardSlug: "drums",
            comment: "Nice work",
            email: "a@example.com",
        });

        expect(mockGetBoardBySlug).toHaveBeenCalledWith("drums");
        expect(mockCreateRecord).toHaveBeenCalledWith("feedback", {
            boardId: "board-1",
            comment: "Nice work",
            email: "a@example.com",
        });
    });

    it("does not set board fields when boardSlug is not provided", async () => {
        mockCreateRecord.mockResolvedValue({
            boardId: null,
            comment: "Thanks",
            email: "b@example.com",
            id: "feedback-2",
        });

        await FeedbackStore.create({
            comment: "Thanks",
            email: "b@example.com",
        });

        expect(mockGetBoardBySlug).not.toHaveBeenCalled();
        expect(mockCreateRecord).toHaveBeenCalledWith("feedback", {
            comment: "Thanks",
            email: "b@example.com",
        });
    });

    it("does not set board fields when boardSlug does not exist", async () => {
        mockGetBoardBySlug.mockResolvedValue(null);
        mockCreateRecord.mockResolvedValue({
            boardId: null,
            comment: "Neat",
            email: "c@example.com",
            id: "feedback-3",
        });

        await FeedbackStore.create({
            boardSlug: "missing",
            comment: "Neat",
            email: "c@example.com",
        });

        expect(mockGetBoardBySlug).toHaveBeenCalledWith("missing");
        expect(mockCreateRecord).toHaveBeenCalledWith("feedback", {
            comment: "Neat",
            email: "c@example.com",
        });
    });
});
