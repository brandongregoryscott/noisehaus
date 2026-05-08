import type { Feedback } from "common";

type CreateFeedbackOptions = Partial<Pick<Feedback, "boardId" | "email">> &
    Pick<Feedback, "comment"> & {
        boardSlug?: string;
    };

export type { CreateFeedbackOptions };
