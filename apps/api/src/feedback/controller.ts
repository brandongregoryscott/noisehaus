import type { CreateFeedbackRequest, CreateFeedbackResponse } from "common";
import type { Response } from "express";
import { FeedbackStore } from "@/feedback/store";
import { created } from "@/utilities/responses";

const FeedbackController = {
    create: async (
        request: CreateFeedbackRequest,
        response: Response
    ): Promise<Response<CreateFeedbackResponse>> => {
        const { body } = request;
        const feedback = await FeedbackStore.create(body);

        return created(response, feedback);
    },
};

export { FeedbackController };
