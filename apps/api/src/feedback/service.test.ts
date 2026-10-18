import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateFeedback, mockGetBoardBySlug } = vi.hoisted(() => ({
    mockCreateFeedback: vi.fn(),
    mockGetBoardBySlug: vi.fn(),
}));

vi.mock("../boards/store", () => ({
    BoardsStore: {
        findBySlug: mockGetBoardBySlug,
    },
}));

vi.mock("../feedback/store", () => ({
    FeedbackStore: {
        create: mockCreateFeedback,
    },
}));

import { FeedbackService } from "@/feedback/service";

describe("FeedbackService", () => {
    beforeEach(() => {
        mockCreateFeedback.mockReset();
        mockGetBoardBySlug.mockReset();
    });

    it("sets boardId when a matching board exists", async () => {
        mockGetBoardBySlug.mockResolvedValue({
            id: "board-1",
            slug: "drums",
        });
        mockCreateFeedback.mockResolvedValue({
            boardId: "board-1",
            comment: "Nice work",
            email: "a@example.com",
            id: "feedback-1",
        });

        await FeedbackService.create({
            boardSlug: "drums",
            comment: "Nice work",
            email: "a@example.com",
        });

        expect(mockGetBoardBySlug).toHaveBeenCalledWith("drums");
        expect(mockCreateFeedback).toHaveBeenCalledWith({
            boardId: "board-1",
            comment: "Nice work",
            email: "a@example.com",
        });
    });

    it("does not set board fields when boardSlug is not provided", async () => {
        mockCreateFeedback.mockResolvedValue({
            boardId: null,
            comment: "Thanks",
            email: "b@example.com",
            id: "feedback-2",
        });

        await FeedbackService.create({
            comment: "Thanks",
            email: "b@example.com",
        });

        expect(mockGetBoardBySlug).not.toHaveBeenCalled();
        expect(mockCreateFeedback).toHaveBeenCalledWith({
            comment: "Thanks",
            email: "b@example.com",
        });
    });

    it("does not set board fields when boardSlug does not exist", async () => {
        mockGetBoardBySlug.mockResolvedValue(null);
        mockCreateFeedback.mockResolvedValue({
            boardId: null,
            comment: "Neat",
            email: "c@example.com",
            id: "feedback-3",
        });

        await FeedbackService.create({
            boardSlug: "missing",
            comment: "Neat",
            email: "c@example.com",
        });

        expect(mockGetBoardBySlug).toHaveBeenCalledWith("missing");
        expect(mockCreateFeedback).toHaveBeenCalledWith({
            comment: "Neat",
            email: "c@example.com",
        });
    });
});
