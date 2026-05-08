import type { Feedback } from "../entities";
import type { ApiSuccessResponse } from "../responses";

type CreateFeedbackOptions = Partial<Pick<Feedback, "email">> &
    Pick<Feedback, "comment"> & {
        boardSlug?: string;
    };

type CreateFeedbackRequest = {
    body: CreateFeedbackOptions;
};

type CreateFeedbackResponse = ApiSuccessResponse<Feedback>;

export type {
    CreateFeedbackOptions,
    CreateFeedbackRequest,
    CreateFeedbackResponse,
};
