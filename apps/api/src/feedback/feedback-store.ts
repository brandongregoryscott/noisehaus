import type { Feedback } from "common";
import { UnexpectedNullError } from "common";
import { isEmpty } from "lodash-es";
import { PocketBaseClient } from "@/pocketbase-client";
import { withPocketBaseResult } from "@/storage/pocketbase-errors";

type CreateStoredFeedbackOptions = Partial<
    Pick<Feedback, "boardId" | "email">
> &
    Pick<Feedback, "comment">;

const FEEDBACK_COLLECTION = "feedback";
type FeedbackRecord = {
    createdAt: string;
} & Omit<Feedback, "createdAt">;

const create = async (
    input: CreateStoredFeedbackOptions
): Promise<Feedback> => {
    const data = await PocketBaseClient.createRecord<FeedbackRecord>(
        FEEDBACK_COLLECTION,
        input
    );

    if (data == null) {
        throw new UnexpectedNullError("Feedback");
    }

    return toFeedback(data);
};

const FeedbackStore = {
    create: withPocketBaseResult(create),
};

const toFeedback = (record: FeedbackRecord): Feedback => ({
    boardId: isEmpty(record.boardId) ? null : record.boardId,
    comment: record.comment,
    createdAt: record.createdAt,
    email: isEmpty(record.email) ? null : record.email,
    id: record.id,
    respondedAt: isEmpty(record.respondedAt) ? null : record.respondedAt,
});

export type { CreateStoredFeedbackOptions };
export { FeedbackStore };
