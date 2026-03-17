import type { Database } from "common/generated/database";

type CreateFeedbackOptions = Pick<
    Database["public"]["Tables"]["feedback"]["Insert"],
    "board_id" | "board_slug" | "email" | "feedback"
>;

export type { CreateFeedbackOptions };
