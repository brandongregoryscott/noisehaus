import type { BoardToken } from "common";
import { isEmpty } from "lodash-es";
import { PocketBaseClient } from "@/pocketbase-client";
import { BOARD_NOT_FOUND_ERROR } from "@/utilities/errors";
import { randomSuffix } from "@/utilities/string-utils";

const BOARD_TOKEN_COLLECTION = "boardTokens";

type BoardTokenRecord = {
    boardId: string;
    createdAt: string;
    id: string;
    token: string;
    updatedAt: string;
};

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
    _boardSlug: string,
    boardId: string
): Promise<BoardToken> => {
    const record = await PocketBaseClient.createRecord<BoardTokenRecord>(
        BOARD_TOKEN_COLLECTION,
        {
            boardId,
            token: `${randomSuffix()}${randomSuffix()}`.slice(0, 8),
        }
    );

    return toBoardToken(record);
};

const unsafe__getByBoardSlugAndToken = async (
    boardSlug: string,
    token: string
): Promise<BoardToken | null> => {
    const board = await PocketBaseClient.getFirstRecordByFilter<{ id: string }>(
        "boards",
        `slug = ${PocketBaseClient.escapeFilterValue(boardSlug)}`
    );
    if (board == null) {
        return null;
    }

    const record =
        await PocketBaseClient.getFirstRecordByFilter<BoardTokenRecord>(
            BOARD_TOKEN_COLLECTION,
            [
                `boardId = ${PocketBaseClient.escapeFilterValue(board.id)}`,
                `token = ${PocketBaseClient.escapeFilterValue(token)}`,
            ].join(" && ")
        );

    return record == null ? null : toBoardToken(record);
};

const unsafe__getByBoardIdAndToken = async (
    boardId: string,
    token: string
): Promise<BoardToken | null> =>
    PocketBaseClient.getFirstRecordByFilter<BoardTokenRecord>(
        BOARD_TOKEN_COLLECTION,
        [
            `boardId = ${PocketBaseClient.escapeFilterValue(boardId)}`,
            `token = ${PocketBaseClient.escapeFilterValue(token)}`,
        ].join(" && ")
    ).then((record) => (record == null ? null : toBoardToken(record)));

const unsafe__deleteAllByBoardId = async (boardId: string): Promise<true> => {
    const records = await PocketBaseClient.listRecords<BoardTokenRecord>(
        BOARD_TOKEN_COLLECTION,
        { filter: `boardId = ${PocketBaseClient.escapeFilterValue(boardId)}` }
    );
    await Promise.all(
        records.map((record) =>
            PocketBaseClient.deleteRecord(BOARD_TOKEN_COLLECTION, record.id)
        )
    );
    return true;
};

const toBoardToken = (record: BoardTokenRecord): BoardToken => ({
    boardId: record.boardId,
    createdAt: record.createdAt,
    id: record.id,
    token: record.token,
    updatedAt: record.updatedAt,
});

const BoardTokensStore = {
    getByBoardSlugAndToken,
    unsafe__deleteAllByBoardId,
    unsafe__getByBoardIdAndToken,
    unsafe__getByBoardSlugAndToken,
    unsafe__insert,
};

export { BoardTokensStore };
