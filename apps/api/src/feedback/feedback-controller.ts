import type { CreateFeedbackRequest } from "common";
import type { Response } from "express";
import { FeedbackService } from "@/feedback/feedback-service";
import { created } from "@/utilities/responses";

const FeedbackController = {
    create: async (
        request: CreateFeedbackRequest,
        response: Response
    ): Promise<Response> => {
        const { body } = request;
        const feedbackResult = await FeedbackService.create(body);

        return created(response, feedbackResult);
    },
};

export { FeedbackController };
