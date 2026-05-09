import type { Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateFeedback } = vi.hoisted(() => ({
    mockCreateFeedback: vi.fn(),
}));

vi.mock("../feedback/store", () => ({
    FeedbackStore: {
        create: mockCreateFeedback,
    },
}));

import { FeedbackController } from "@/feedback/controller";

const createMockResponse = (): Response =>
    ({
        json: vi.fn(),
        status: vi.fn().mockReturnThis(),
    }) as unknown as Response;

describe("FeedbackController", () => {
    beforeEach(() => {
        mockCreateFeedback.mockReset();
    });

    it("creates feedback and returns the created response", async () => {
        const response = createMockResponse();
        mockCreateFeedback.mockResolvedValue({
            boardId: "board-1",
            comment: "Nice work",
            email: "a@example.com",
            id: "feedback-1",
        });

        const body = {
            boardId: "board-1",
            comment: "Nice work",
            email: "a@example.com",
        };

        await FeedbackController.create({ body }, response);

        expect(mockCreateFeedback).toHaveBeenCalledWith({
            ...body,
        });
        expect(response.status).toHaveBeenCalledWith(201);
        expect(response.json).toHaveBeenCalledWith({
            data: {
                boardId: "board-1",
                comment: "Nice work",
                email: "a@example.com",
                id: "feedback-1",
            },
            error: null,
        });
    });
});
