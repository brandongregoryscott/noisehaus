import type { Feedback } from "common";
import type { CreateFeedbackOptions } from "@/feedback/types";
import { BoardsStore } from "@/boards/store";
import { FeedbackStore } from "@/feedback/store";

const create = async (input: CreateFeedbackOptions): Promise<Feedback> => {
    const createInput = await normalizeCreateInput(input);
    return FeedbackStore.create(createInput);
};

const normalizeCreateInput = async (
    input: CreateFeedbackOptions
): Promise<CreateFeedbackOptions> => {
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
): CreateFeedbackOptions => {
    const { boardSlug: _boardSlug, ...rest } = input;
    return rest;
};

const FeedbackService = { create };

export { FeedbackService };
