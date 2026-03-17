import type { Feedback } from "../entities";
import type { ApiSuccessResponse } from "../responses";

type CreateFeedbackOptions = Partial<
    Pick<Feedback, "board_id" | "board_slug" | "email">
> &
    Pick<Feedback, "feedback">;

type CreateFeedbackRequest = {
    body: CreateFeedbackOptions;
};

type CreateFeedbackResponse = ApiSuccessResponse<Feedback>;

export type {
    CreateFeedbackOptions,
    CreateFeedbackRequest,
    CreateFeedbackResponse,
};
