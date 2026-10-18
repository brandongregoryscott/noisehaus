import type { CreateFeedbackRequest } from "common";
import type { Request, Response } from "express";
import { sendResultResponse } from "@/error-handler";
import { FeedbackService } from "@/feedback/feedback-service";

const FeedbackController = {
    create: async (
        request: CreateFeedbackRequest & Partial<Request>,
        response: Response
    ): Promise<Response> => {
        const { body } = request;
        const feedback = await FeedbackService.create(body);

        return sendResultResponse(feedback, request, response, 201);
    },
};

export { FeedbackController };
