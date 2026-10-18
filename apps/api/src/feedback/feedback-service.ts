import type { Feedback } from "common";
import type { CreateStoredFeedbackOptions } from "@/feedback/feedback-store";
import { BoardsStore } from "@/boards/boards-store";
import { FeedbackStore } from "@/feedback/feedback-store";

type CreateFeedbackOptions = {
    boardSlug?: string;
} & CreateStoredFeedbackOptions;

const create = async (input: CreateFeedbackOptions): Promise<Feedback> => {
    const createInput = await normalizeCreateInput(input);
    return FeedbackStore.create(createInput);
};

const normalizeCreateInput = async (
    input: CreateFeedbackOptions
): Promise<CreateStoredFeedbackOptions> => {
    const { boardSlug } = input;
    if (boardSlug == null) {
        return omitBoardFields(input);
    }

    const board = await BoardsStore.findBySlug(boardSlug);
    if (board == null) {
        return omitBoardFields(input);
    }

    return { ...omitBoardFields(input), boardId: board.id };
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
