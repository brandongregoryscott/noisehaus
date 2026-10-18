import type { BoardToken } from "common";
import { PocketBaseClient } from "@/pocketbase-client";
import { withPocketBaseResult } from "@/storage/pocketbase-errors";

const BOARD_TOKEN_COLLECTION = "boardTokens";

type BoardTokenRecord = {
    boardId: string;
    createdAt: string;
    id: string;
    token: string;
    updatedAt: string;
};

const findByBoardIdAndToken = async (
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

const toBoardToken = (record: BoardTokenRecord): BoardToken => ({
    boardId: record.boardId,
    createdAt: record.createdAt,
    id: record.id,
    token: record.token,
    updatedAt: record.updatedAt,
});

const BoardTokensStore = {
    findByBoardIdAndToken: withPocketBaseResult(findByBoardIdAndToken),
};

export { BoardTokensStore };
