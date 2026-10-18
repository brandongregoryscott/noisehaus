import type { Board, BoardToken } from "common";
import { ViewPermission } from "common";
import { randomBytes } from "node:crypto";
import { PocketBaseClient } from "@/pocketbase-client";
import {
    withPocketBaseErrors,
    withPocketBaseResult,
} from "@/storage/pocketbase-errors";
import { UnexpectedNullError } from "@/utilities/errors";

type CreateBoardResult = {
    token: string;
} & Board;

type CreateStoredBoardOptions = Pick<Board, "name" | "slug" | "viewPermission">;

const BOARD_COLLECTION = "boards";
type BoardRecord = {
    createdAt: string;
    id: string;
    name: string;
    slug: string;
    updatedAt: string;
    viewPermission: string;
};

const getAllPublic = async (): Promise<Board[]> => {
    const viewPermission = PocketBaseClient.escapeFilterValue(
        ViewPermission.Public
    );
    const records = await PocketBaseClient.listRecords<BoardRecord>(
        BOARD_COLLECTION,
        {
            filter: `viewPermission = ${viewPermission}`,
        }
    );

    return records.map(toBoard);
};

const findById = async (id: string): Promise<Board | null> => {
    const record = await PocketBaseClient.getFirstRecordByFilter<BoardRecord>(
        BOARD_COLLECTION,
        `id = ${PocketBaseClient.escapeFilterValue(id)}`
    );

    if (record == null) {
        return null;
    }

    return toBoard(record);
};

const findBySlug = async (slug: string): Promise<Board | null> => {
    const record = await PocketBaseClient.getFirstRecordByFilter<BoardRecord>(
        BOARD_COLLECTION,
        `slug = ${PocketBaseClient.escapeFilterValue(slug)}`
    );

    if (record == null) {
        return null;
    }

    return toBoard(record);
};

const createWithInitialToken = async (
    input: CreateStoredBoardOptions
): Promise<CreateBoardResult> => {
    const id = randomBytes(8).toString("hex").slice(0, 15);
    const token = randomBytes(4).toString("hex");
    const [board, boardToken] = await PocketBaseClient.createRecords<
        [BoardRecord, BoardToken]
    >([
        {
            collection: BOARD_COLLECTION,
            data: { ...input, id },
        },
        { collection: "boardTokens", data: { boardId: id, token } },
    ]);

    if (board == null || boardToken == null) {
        throw new UnexpectedNullError("board creation result");
    }

    return { ...toBoard(board), token: boardToken.token };
};

const toBoard = (record: BoardRecord): Board => ({
    createdAt: record.createdAt,
    id: record.id,
    name: record.name,
    slug: record.slug,
    updatedAt: record.updatedAt,
    viewPermission: record.viewPermission,
});

const update = async (
    id: string,
    input: Partial<Pick<Board, "name" | "slug" | "viewPermission">>
): Promise<Board> => {
    const record = await PocketBaseClient.updateRecord<BoardRecord>(
        BOARD_COLLECTION,
        id,
        input
    );
    return toBoard(record);
};

const _delete = async (id: string): Promise<void> => {
    // Native cascades remove files, tokens, and feedback in this transaction.
    await PocketBaseClient.deleteRecord(BOARD_COLLECTION, id);
};

const BoardsStore = {
    createWithInitialToken: withPocketBaseResult(createWithInitialToken),
    delete: withPocketBaseErrors(_delete),
    findById: withPocketBaseErrors(findById),
    findBySlug: withPocketBaseErrors(findBySlug),
    getAllPublic: withPocketBaseErrors(getAllPublic),
    update: withPocketBaseErrors(update),
};

export type { CreateBoardResult, CreateStoredBoardOptions };
export { BoardsStore };
