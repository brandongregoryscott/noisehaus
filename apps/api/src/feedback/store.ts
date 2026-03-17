import type { Feedback } from "common";
import type { CreateFeedbackOptions } from "@/feedback/types";
import { BoardsStore } from "@/boards/store";
import { SupabaseClient } from "@/supabase-client";
import { UnexpectedNullError } from "@/utilities/errors";

const create = async (input: CreateFeedbackOptions): Promise<Feedback> => {
    const createInput = await normalizeCreateInput(input);
    const { data } = await table()
        .insert(createInput)
        .throwOnError()
        .select("*")
        .single();

    if (data == null) {
        throw new UnexpectedNullError("Feedback");
    }

    return data;
};

const normalizeCreateInput = async (
    input: CreateFeedbackOptions
): Promise<CreateFeedbackOptions> => {
    const { board_slug: boardSlug } = input;
    if (boardSlug == null) {
        return omitBoardFields(input);
    }

    const board = await BoardsStore.unsafe__getBySlug(boardSlug);
    if (board == null) {
        return omitBoardFields(input);
    }

    return {
        ...input,
        board_id: board.id,
        board_slug: board.slug,
    };
};

const omitBoardFields = (
    input: CreateFeedbackOptions
): CreateFeedbackOptions => {
    const { board_id: _boardId, board_slug: _boardSlug, ...rest } = input;
    return rest;
};

const table = () => SupabaseClient.from("feedback");

const FeedbackStore = {
    create,
    table,
};

export { FeedbackStore };
