import type { Feedback, Result, StoreError } from "common";
import { ok } from "common";
import type { CreateStoredFeedbackOptions } from "@/feedback/feedback-store";
import { BoardsStore } from "@/boards/boards-store";
import { FeedbackStore } from "@/feedback/feedback-store";

type CreateFeedbackOptions = {
    boardSlug?: string;
} & CreateStoredFeedbackOptions;

const create = async (
    input: CreateFeedbackOptions
): Promise<Result<Feedback, StoreError>> => {
    const createInputResult = await normalizeCreateInput(input);
    if (createInputResult.isErr) {
        return createInputResult;
    }
    return FeedbackStore.create(createInputResult.value);
};

const normalizeCreateInput = async (
    input: CreateFeedbackOptions
): Promise<Result<CreateStoredFeedbackOptions, StoreError>> => {
    const { boardSlug } = input;
    if (boardSlug == null) {
        return ok(omitBoardFields(input));
    }

    const boardResult = await BoardsStore.findBySlug(boardSlug);
    if (boardResult.isErr) {
        return boardResult;
    }
    const board = boardResult.value;
    if (board == null) {
        return ok(omitBoardFields(input));
    }

    return ok({ ...omitBoardFields(input), boardId: board.id });
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
