import { err, PersistenceError, ok } from "common";
import { beforeEach, assert, describe, expect, it, vi } from "vitest";

const { mockCreateFeedback, mockGetBoardBySlug } = vi.hoisted(() => ({
    mockCreateFeedback: vi.fn(),
    mockGetBoardBySlug: vi.fn(),
}));

vi.mock("../boards/boards-store", () => ({
    BoardsStore: {
        findBySlug: mockGetBoardBySlug,
    },
}));

vi.mock("../feedback/feedback-store", () => ({
    FeedbackStore: {
        create: mockCreateFeedback,
    },
}));

import { FeedbackService } from "@/feedback/feedback-service";

describe("FeedbackService", () => {
    beforeEach(() => {
        mockCreateFeedback.mockReset();
        mockGetBoardBySlug.mockReset();
    });

    it("sets boardId when a matching board exists", async () => {
        mockGetBoardBySlug.mockResolvedValue(
            ok({
                id: "board-1",
                slug: "drums",
            })
        );
        mockCreateFeedback.mockResolvedValue(
            ok({
                boardId: "board-1",
                comment: "Nice work",
                email: "a@example.com",
                id: "feedback-1",
            })
        );

        await FeedbackService.create({
            boardSlug: "drums",
            comment: "Nice work",
            email: "a@example.com",
        }).toPromise();

        expect(mockGetBoardBySlug).toHaveBeenCalledWith("drums");
        expect(mockCreateFeedback).toHaveBeenCalledWith({
            boardId: "board-1",
            comment: "Nice work",
            email: "a@example.com",
        });
    });

    it("does not set board fields when boardSlug is not provided", async () => {
        mockCreateFeedback.mockResolvedValue(
            ok({
                boardId: null,
                comment: "Thanks",
                email: "b@example.com",
                id: "feedback-2",
            })
        );

        await FeedbackService.create({
            comment: "Thanks",
            email: "b@example.com",
        }).toPromise();

        expect(mockGetBoardBySlug).not.toHaveBeenCalled();
        expect(mockCreateFeedback).toHaveBeenCalledWith({
            comment: "Thanks",
            email: "b@example.com",
        });
    });

    it("does not set board fields when boardSlug does not exist", async () => {
        mockGetBoardBySlug.mockResolvedValue(ok(null));
        mockCreateFeedback.mockResolvedValue(
            ok({
                boardId: null,
                comment: "Neat",
                email: "c@example.com",
                id: "feedback-3",
            })
        );

        await FeedbackService.create({
            boardSlug: "missing",
            comment: "Neat",
            email: "c@example.com",
        }).toPromise();

        expect(mockGetBoardBySlug).toHaveBeenCalledWith("missing");
        expect(mockCreateFeedback).toHaveBeenCalledWith({
            comment: "Neat",
            email: "c@example.com",
        });
    });

    it("does not create feedback when board lookup fails", async () => {
        const error = new PersistenceError(new Error("Board lookup failed"));
        mockGetBoardBySlug.mockResolvedValue(err(error));

        const result = await FeedbackService.create({
            boardSlug: "drums",
            comment: "Thanks",
        }).toPromise();

        assert(result.isPersistenceError());
        expect(result.error).toBe(error);
        expect(mockCreateFeedback).not.toHaveBeenCalled();
    });

    it("preserves feedback persistence failures after board lookup succeeds", async () => {
        const error = new PersistenceError(new Error("Feedback write failed"));
        mockGetBoardBySlug.mockResolvedValue(ok({ id: "board-1" }));
        mockCreateFeedback.mockResolvedValue(err(error));
        const input = { boardSlug: "drums", comment: "Thanks" };

        const result = await FeedbackService.create(input).toPromise();

        assert(result.isPersistenceError());
        expect(result.error).toBe(error);
        expect(mockCreateFeedback).toHaveBeenCalledExactlyOnceWith({
            boardId: "board-1",
            comment: "Thanks",
        });
    });

    it("propagates unexpected board lookup exceptions before creating feedback", async () => {
        const error = new Error("Broken configuration");
        mockGetBoardBySlug.mockImplementation(() => {
            throw error;
        });
        const input = { boardSlug: "drums", comment: "Thanks" };

        const promise = FeedbackService.create(input).toPromise();

        await expect(promise).rejects.toBe(error);
        expect(mockCreateFeedback).not.toHaveBeenCalled();
    });
});
