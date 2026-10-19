import type { Feedback, Result, StoreError } from "common";
import { ok, Task } from "common";
import type { CreateStoredFeedbackOptions } from "@/feedback/feedback-store";
import { BoardsStore } from "@/boards/boards-store";
import { FeedbackStore } from "@/feedback/feedback-store";

type CreateFeedbackOptions = {
    boardSlug?: string;
} & CreateStoredFeedbackOptions;

const create = (
    input: CreateFeedbackOptions
): Promise<Result<Feedback, StoreError>> =>
    normalizeCreateInput(input)
        .andThen((createInput) => FeedbackStore.create(createInput))
        .toPromise();

const normalizeCreateInput = (
    input: CreateFeedbackOptions
): Task<CreateStoredFeedbackOptions, StoreError> => {
    const { boardSlug } = input;
    if (boardSlug == null) {
        return Task.fromResult(ok(omitBoardFields(input)));
    }

    return Task.fromPromise(() => BoardsStore.findBySlug(boardSlug)).map(
        (board) =>
            board === null
                ? omitBoardFields(input)
                : { ...omitBoardFields(input), boardId: board.id }
    );
};

const omitBoardFields = (
    input: CreateFeedbackOptions
): CreateStoredFeedbackOptions => {
    const { boardSlug: _boardSlug, ...rest } = input;
    return rest;
};

const FeedbackService = { create };

export type { CreateFeedbackOptions };
export { FeedbackService };
