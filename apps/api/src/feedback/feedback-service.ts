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
    const createInput = await normalizeCreateInput(input);
    if (createInput.isErr) {
        return createInput;
    }
    return FeedbackStore.create(createInput.value);
};

const normalizeCreateInput = async (
    input: CreateFeedbackOptions
): Promise<Result<CreateStoredFeedbackOptions, StoreError>> => {
    const { boardSlug } = input;
    if (boardSlug == null) {
        return ok(omitBoardFields(input));
    }

    const board = await BoardsStore.findBySlug(boardSlug);
    if (board.isErr) {
        return board;
    }
    if (board.value == null) {
        return ok(omitBoardFields(input));
    }

    return ok({ ...omitBoardFields(input), boardId: board.value.id });
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
