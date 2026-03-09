import type { BoardToken } from "common";
import { SupabaseClient } from "@/supabase-client";
import { BOARD_NOT_FOUND_ERROR } from "@/utilities/errors";

const getByBoardSlugAndToken = async (
    boardSlug: string,
    token: string
): Promise<BoardToken> => {
    const boardToken = await unsafe__getByBoardSlugAndToken(boardSlug, token);

    if (boardToken === null) {
        throw BOARD_NOT_FOUND_ERROR;
    }

    return boardToken;
};

const unsafe__insert = async (
    boardSlug: string,
    boardId: string
): Promise<BoardToken> => {
    const { data } = await table()
        .insert({
            board_id: boardId,
            board_slug: boardSlug,
        })
        .throwOnError()
        .select("*")
        .single();

    return data!;
};

const unsafe__getByBoardSlugAndToken = async (
    boardSlug: string,
    token: string
): Promise<BoardToken | null> => {
    const { data } = await table()
        .select("*")
        .throwOnError()
        .eq("board_slug", boardSlug)
        .eq("token", token)
        .maybeSingle();

    return data;
};

const unsafe__getByBoardIdAndToken = async (
    boardId: string,
    token: string
): Promise<BoardToken | null> => {
    const { data } = await table()
        .select("*")
        .throwOnError()
        .eq("board_id", boardId)
        .eq("token", token)
        .maybeSingle();

    return data;
};

const table = () => SupabaseClient.from("board_token");

const BoardTokensStore = {
    getByBoardSlugAndToken,
    table,
    unsafe__getByBoardIdAndToken,
    unsafe__getByBoardSlugAndToken,
    unsafe__insert,
};

export { BoardTokensStore };
