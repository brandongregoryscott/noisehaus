import type { CreateFeedbackRequest } from "common";
import type { Response } from "express";
import { FeedbackService } from "@/feedback/feedback-service";
import { HttpResponse } from "@/utilities/responses";

const FeedbackController = {
    create: async (
        request: CreateFeedbackRequest,
        response: Response
    ): Promise<Response> => {
        const { body } = request;
        const feedbackResult = await FeedbackService.create(body);

        return HttpResponse.created(response, feedbackResult);
    },
};

export { FeedbackController };
