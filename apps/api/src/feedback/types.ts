import type { Feedback } from "common";

type CreateFeedbackOptions = {
        boardSlug?: string;
    } &
    Partial<Pick<Feedback, "boardId" | "email">> & Pick<Feedback, "comment">;

export type { CreateFeedbackOptions };
