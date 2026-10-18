import type { Feedback } from "common";
import { isEmpty } from "lodash-es";
import type { CreateFeedbackOptions } from "@/feedback/types";
import { PocketBaseClient } from "@/pocketbase-client";
import { withPocketBaseErrors } from "@/storage/pocketbase-errors";
import { UnexpectedNullError } from "@/utilities/errors";

const FEEDBACK_COLLECTION = "feedback";
type FeedbackRecord = {
    createdAt: string;
} & Omit<Feedback, "createdAt">;

const create = async (
    input: Omit<CreateFeedbackOptions, "boardSlug">
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
    create: withPocketBaseErrors(create),
};

const toFeedback = (record: FeedbackRecord): Feedback => ({
    boardId: isEmpty(record.boardId) ? null : record.boardId,
    comment: record.comment,
    createdAt: record.createdAt,
    email: isEmpty(record.email) ? null : record.email,
    id: record.id,
    respondedAt: isEmpty(record.respondedAt) ? null : record.respondedAt,
});

export { FeedbackStore };
