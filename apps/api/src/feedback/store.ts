import type { Feedback } from "common";
import { isEmpty } from "lodash-es";
import type { CreateFeedbackOptions } from "@/feedback/types";
import { BoardsStore } from "@/boards/store";
import { PocketBaseClient } from "@/pocketbase-client";
import { UnexpectedNullError } from "@/utilities/errors";

const FEEDBACK_COLLECTION = "feedback";
type FeedbackRecord = {
    createdAt: string;
} & Omit<Feedback, "createdAt">;

const create = async (input: CreateFeedbackOptions): Promise<Feedback> => {
    const createInput = await normalizeCreateInput(input);
    const data = await PocketBaseClient.createRecord<FeedbackRecord>(
        FEEDBACK_COLLECTION,
        createInput
    );

    if (data == null) {
        throw new UnexpectedNullError("Feedback");
    }

    return toFeedback(data);
};

const normalizeCreateInput = async (
    input: CreateFeedbackOptions
): Promise<CreateFeedbackOptions> => {
    const { boardSlug } = input;
    if (boardSlug == null) {
        return omitBoardFields(input);
    }

    const board = await BoardsStore.unsafe__getBySlug(boardSlug);
    if (board == null) {
        return omitBoardFields(input);
    }

    return { ...omitBoardFields(input), boardId: board.id };
};

const omitBoardFields = (
    input: CreateFeedbackOptions
): CreateFeedbackOptions => {
    const { boardSlug: _boardSlug, ...rest } = input;
    return rest;
};

const unsafe__deleteByBoardId = async (boardId: string): Promise<void> => {
    const records = await PocketBaseClient.listRecords<FeedbackRecord>(
        FEEDBACK_COLLECTION,
        { filter: `boardId = ${PocketBaseClient.escapeFilterValue(boardId)}` }
    );
    await Promise.all(
        records.map((record) =>
            PocketBaseClient.deleteRecord(FEEDBACK_COLLECTION, record.id)
        )
    );
};

const FeedbackStore = {
    create,
    unsafe__deleteByBoardId,
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
