import type { Board } from "common";
import { ViewPermission } from "common";
import { isEmpty } from "lodash-es";
import type {
    CreateBoardOptions,
    CreateBoardResult,
    GetBoardByTokenOptions,
    UpdateBoardOptions,
} from "@/boards/types";
import { BoardFilesStore } from "@/board-files/store";
import { BoardTokensStore } from "@/board-tokens/store";
import { FeedbackStore } from "@/feedback/store";
import { PocketBaseClient } from "@/pocketbase-client";
import {
    BOARD_NOT_FOUND_ERROR,
    isPocketBaseUniqueConstraintError,
    UnexpectedNullError,
    ValidationError,
} from "@/utilities/errors";
import { randomSuffix } from "@/utilities/string-utils";

type InsertOptions = {
    attempt?: number;
} & CreateBoardOptions;

const BOARD_COLLECTION = "boards";
const MAX_CREATE_ATTEMPTS = 5;

type BoardRecord = {
    createdAt: string;
    id: string;
    name: string;
    slug: string;
    updatedAt: string;
    viewPermission: string;
};

const VALID_GET_BY_SLUG_PERMISSIONS = [
    ViewPermission.Public,
    ViewPermission.BySlug,
];

const _delete = async (slug: string, token: string): Promise<true> => {
    const board = await authorizeWritePermissionOrThrow({ slug, token });

    await Promise.all([
        BoardFilesStore.unsafe__deleteAllByBoardId(board.id),
        BoardTokensStore.unsafe__deleteAllByBoardId(board.id),
        FeedbackStore.unsafe__deleteByBoardId(board.id),
    ]);
    await unsafe__delete(slug);

    return true;
};

const getAllPublic = async (): Promise<Board[]> => unsafe__getAllPublic();

const getBySlug = async (slug: string): Promise<Board> => {
    const board = await unsafe__getBySlug(slug);

    if (
        board === null ||
        !VALID_GET_BY_SLUG_PERMISSIONS.includes(
            board.viewPermission as ViewPermission
        )
    ) {
        throw BOARD_NOT_FOUND_ERROR;
    }

    return board;
};

const getByToken = async (options: GetBoardByTokenOptions): Promise<Board> => {
    const { id = "", slug = "", token } = options;
    const hasId = !isEmpty(id);
    const hasSlug = !isEmpty(slug);

    if (!hasId && !hasSlug) {
        throw new ValidationError("An id or slug is required");
    }

    const board = hasId
        ? await unsafe__getById(id)
        : await unsafe__getBySlug(slug);
    const boardToken =
        board == null
            ? null
            : await BoardTokensStore.unsafe__getByBoardIdAndToken(
                  board.id,
                  token
              );

    if (board === null || boardToken === null) {
        throw BOARD_NOT_FOUND_ERROR;
    }

    return board;
};

const insert = async (options: InsertOptions): Promise<CreateBoardResult> => {
    const { attempt = 0, name } = options;
    let { slug } = options;
    if (attempt > 0) {
        slug = `${slug}-${randomSuffix()}`;
    }

    try {
        return await unsafe__insert({ name, slug });
    } catch (error) {
        if (
            isPocketBaseUniqueConstraintError(error, "slug") &&
            attempt < MAX_CREATE_ATTEMPTS
        ) {
            return insert({ ...options, attempt: attempt + 1 });
        }

        throw error;
    }
};

const update = async (input: UpdateBoardOptions): Promise<Board> => {
    const { originalSlug, token, ...updatedBoard } = input;
    await authorizeWritePermissionOrThrow({ slug: originalSlug, token });

    return unsafe__update({ originalSlug, ...updatedBoard });
};

const unsafe__delete = async (slug: string): Promise<void> => {
    const board = await unsafe__getBySlug(slug);
    if (board == null) {
        return;
    }

    await PocketBaseClient.deleteRecord(BOARD_COLLECTION, board.id);
};

const unsafe__getAllPublic = async (): Promise<Board[]> => {
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

const unsafe__getById = async (id: string): Promise<Board | null> =>
    PocketBaseClient.getFirstRecordByFilter<BoardRecord>(
        BOARD_COLLECTION,
        `id = ${PocketBaseClient.escapeFilterValue(id)}`
    ).then((record) => (record == null ? null : toBoard(record)));

const unsafe__getBySlug = async (slug: string): Promise<Board | null> =>
    PocketBaseClient.getFirstRecordByFilter<BoardRecord>(
        BOARD_COLLECTION,
        `slug = ${PocketBaseClient.escapeFilterValue(slug)}`
    ).then((record) => (record == null ? null : toBoard(record)));

const unsafe__insert = async (
    input: CreateBoardOptions
): Promise<CreateBoardResult> => {
    const board = await PocketBaseClient.createRecord<BoardRecord>(
        BOARD_COLLECTION,
        {
            ...input,
            viewPermission: ViewPermission.BySlug,
        }
    );

    if (board === null) {
        throw new UnexpectedNullError("board");
    }

    const boardToken = await BoardTokensStore.unsafe__insert(
        board.slug,
        board.id
    );

    if (boardToken === null) {
        throw new UnexpectedNullError("boardToken");
    }

    return { ...toBoard(board), token: boardToken.token };
};

const unsafe__update = async (
    input: Omit<UpdateBoardOptions, "token">
): Promise<Board> => {
    const { originalSlug, ...updatedBoard } = input;
    const existingBoard = await unsafe__getBySlug(originalSlug);
    if (existingBoard == null) {
        throw BOARD_NOT_FOUND_ERROR;
    }

    const board = await PocketBaseClient.updateRecord<BoardRecord>(
        BOARD_COLLECTION,
        existingBoard.id,
        updatedBoard
    );
    return toBoard(board);
};

const authorizeWritePermissionOrThrow = getByToken;

const toBoard = (record: BoardRecord): Board => ({
    createdAt: record.createdAt,
    id: record.id,
    name: record.name,
    slug: record.slug,
    updatedAt: record.updatedAt,
    viewPermission: record.viewPermission,
});

const BoardsStore = {
    authorizeWritePermissionOrThrow,
    delete: _delete,
    getAllPublic,
    getBySlug,
    getByToken,
    insert,
    MAX_CREATE_ATTEMPTS,
    unsafe__delete,
    unsafe__getAllPublic,
    unsafe__getById,
    unsafe__getBySlug,
    unsafe__insert,
    unsafe__update,
    update,
};

export { BoardsStore };
