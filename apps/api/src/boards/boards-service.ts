import type { ServiceError, Board, StoreError, Result } from "common";
import {
    err,
    ok,
    ViewPermission,
    BOARD_NOT_FOUND_ERROR,
    ValidationError,
} from "common";
import { isEmpty } from "lodash-es";
import type { CreateBoardResult } from "@/boards/boards-store";
import { BoardTokensStore } from "@/board-tokens/board-tokens-store";
import { BoardsStore } from "@/boards/boards-store";
import { randomSuffix } from "@/utilities/string-utils";

type CreateBoardOptions = Pick<Board, "name" | "slug">;

type UpdateBoardOptions = {
    /**
     * Original slug of the board to update.
     */
    originalSlug: string;
    /**
     * Token to authorize the board access with.
     */
    token: string;
} & Partial<Pick<Board, "name" | "slug" | "viewPermission">>;

type GetBoardByTokenOptions = {
    /**
     * Id of the board to retrieve by token. Required if slug is not provided.
     */
    id?: string;

    /**
     * Id of the board to retrieve by token. Required if id is not provided.
     */
    slug?: string;

    /**
     * Token to authorize the board access with.
     */
    token: string;
};

type InsertOptions = { attempt?: number } & CreateBoardOptions;
const MAX_CREATE_ATTEMPTS = 5;

const VALID_GET_BY_SLUG_PERMISSIONS = [
    ViewPermission.Public,
    ViewPermission.BySlug,
];

const _delete = async (
    slug: string,
    token: string
): Promise<Result<true, ServiceError>> => {
    const board = await authorizeWritePermission({ slug, token });
    if (board.isErr) {
        return board;
    }
    const deleted = await BoardsStore.delete(board.value.id);
    return deleted.isErr ? deleted : ok(true);
};

const getAllPublic = async (): Promise<Result<Board[], StoreError>> =>
    BoardsStore.getAllPublic();

const getBySlug = async (
    slug: string
): Promise<Result<Board, ServiceError>> => {
    const board = await BoardsStore.findBySlug(slug);
    if (board.isErr) {
        return board;
    }
    if (
        board.value === null ||
        !VALID_GET_BY_SLUG_PERMISSIONS.includes(
            board.value.viewPermission as ViewPermission
        )
    ) {
        return err(BOARD_NOT_FOUND_ERROR);
    }
    return ok(board.value);
};

const getByToken = async (
    options: GetBoardByTokenOptions
): Promise<Result<Board, ServiceError>> => {
    const { id = "", slug = "", token } = options;
    const hasId = !isEmpty(id);
    const hasSlug = !isEmpty(slug);
    if (!hasId && !hasSlug) {
        return err(new ValidationError("An id or slug is required"));
    }

    const board = hasId
        ? await BoardsStore.findById(id)
        : await BoardsStore.findBySlug(slug);
    if (board.isErr) {
        return board;
    }
    if (board.value === null) {
        return err(BOARD_NOT_FOUND_ERROR);
    }
    const boardToken = await BoardTokensStore.findByBoardIdAndToken(
        board.value.id,
        token
    );
    if (boardToken.isErr) {
        return boardToken;
    }
    return boardToken.value === null
        ? err(BOARD_NOT_FOUND_ERROR)
        : ok(board.value);
};

const insert = async (
    options: InsertOptions
): Promise<Result<CreateBoardResult, StoreError>> => {
    const { attempt = 0, name } = options;
    let { slug } = options;
    if (attempt > 0) {
        slug = `${slug}-${randomSuffix()}`;
    }

    const result = await BoardsStore.createWithInitialToken({
        name,
        slug,
        viewPermission: ViewPermission.BySlug,
    });
    if (
        result.isUniqueConstraintError("slug") &&
        attempt < MAX_CREATE_ATTEMPTS
    ) {
        return insert({ ...options, attempt: attempt + 1 });
    }

    return result;
};

const update = async (
    input: UpdateBoardOptions
): Promise<Result<Board, ServiceError>> => {
    const { originalSlug, token, ...updatedBoard } = input;
    const board = await authorizeWritePermission({ slug: originalSlug, token });
    if (board.isErr) {
        return board;
    }
    return BoardsStore.update(board.value.id, updatedBoard);
};

const get = async (
    slug: string,
    token?: string
): Promise<Result<Board, ServiceError>> => {
    const board = await BoardsStore.findBySlug(slug);
    if (board.isErr) {
        return board;
    }
    if (board.value == null) {
        return err(BOARD_NOT_FOUND_ERROR);
    }
    // Ignore tokens for boards that can be read by slug.
    if (board.value.viewPermission !== ViewPermission.ByToken) {
        return ok(board.value);
    }
    if (isEmpty(token)) {
        return err(BOARD_NOT_FOUND_ERROR);
    }
    return getByToken({ slug, token: token! });
};

const authorizeWritePermission = getByToken;
const BoardsService = {
    authorizeWritePermission,
    delete: _delete,
    get,
    getAllPublic,
    getBySlug,
    getByToken,
    insert,
    MAX_CREATE_ATTEMPTS,
    update,
};

export type { CreateBoardOptions, GetBoardByTokenOptions, UpdateBoardOptions };
export { BoardsService };
