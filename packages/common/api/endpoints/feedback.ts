import type { Feedback } from "../entities";
import type { ApiSuccessResponse } from "../responses";

type CreateFeedbackOptions = {
    boardSlug?: string;
} & Partial<Pick<Feedback, "email">> &
    Pick<Feedback, "comment">;

type CreateFeedbackRequest = {
    body: CreateFeedbackOptions;
};

type CreateFeedbackResponse = ApiSuccessResponse<Feedback>;

export type {
    CreateFeedbackOptions,
    CreateFeedbackRequest,
    CreateFeedbackResponse,
};
