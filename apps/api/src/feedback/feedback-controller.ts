import type { CreateFeedbackRequest } from "common";
import type { Response as ExpressResponse } from "express";
import { FeedbackService } from "@/feedback/feedback-service";
import { Response } from "@/utilities/responses";

const FeedbackController = {
    create: async (
        request: CreateFeedbackRequest,
        response: ExpressResponse
    ): Promise<ExpressResponse> => {
        const { body } = request;
        const feedbackResult = await FeedbackService.create(body);

        return Response.created(response, feedbackResult);
    },
};

export { FeedbackController };
