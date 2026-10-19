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
    const boardResult = await authorizeWritePermission({ slug, token });
    if (boardResult.isErr) {
        return boardResult;
    }
    const board = boardResult.value;
    const deleteResult = await BoardsStore.delete(board.id);
    return deleteResult.isErr ? deleteResult : ok(true);
};

const getAllPublic = async (): Promise<Result<Board[], StoreError>> =>
    BoardsStore.getAllPublic();

const getBySlug = async (
    slug: string
): Promise<Result<Board, ServiceError>> => {
    const boardResult = await BoardsStore.findBySlug(slug);
    if (boardResult.isErr) {
        return boardResult;
    }
    const board = boardResult.value;
    if (
        board === null ||
        !VALID_GET_BY_SLUG_PERMISSIONS.includes(
            board.viewPermission as ViewPermission
        )
    ) {
        return err(BOARD_NOT_FOUND_ERROR);
    }
    return ok(board);
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

    const boardResult = hasId
        ? await BoardsStore.findById(id)
        : await BoardsStore.findBySlug(slug);
    if (boardResult.isErr) {
        return boardResult;
    }
    const board = boardResult.value;
    if (board === null) {
        return err(BOARD_NOT_FOUND_ERROR);
    }
    const boardTokenResult = await BoardTokensStore.findByBoardIdAndToken(
        board.id,
        token
    );
    if (boardTokenResult.isErr) {
        return boardTokenResult;
    }
    return boardTokenResult.value === null
        ? err(BOARD_NOT_FOUND_ERROR)
        : ok(board);
};

const insert = async (
    options: InsertOptions
): Promise<Result<CreateBoardResult, StoreError>> => {
    const { attempt = 0, name } = options;
    let { slug } = options;
    if (attempt > 0) {
        slug = `${slug}-${randomSuffix()}`;
    }

    const boardResult = await BoardsStore.createWithInitialToken({
        name,
        slug,
        viewPermission: ViewPermission.BySlug,
    });
    if (
        boardResult.isUniqueConstraintError("slug") &&
        attempt < MAX_CREATE_ATTEMPTS
    ) {
        return insert({ ...options, attempt: attempt + 1 });
    }

    return boardResult;
};

const update = async (
    input: UpdateBoardOptions
): Promise<Result<Board, ServiceError>> => {
    const { originalSlug, token, ...updatedBoard } = input;
    const boardResult = await authorizeWritePermission({
        slug: originalSlug,
        token,
    });
    if (boardResult.isErr) {
        return boardResult;
    }
    const board = boardResult.value;
    return BoardsStore.update(board.id, updatedBoard);
};

const get = async (
    slug: string,
    token?: string
): Promise<Result<Board, ServiceError>> => {
    const boardResult = await BoardsStore.findBySlug(slug);
    if (boardResult.isErr) {
        return boardResult;
    }
    const board = boardResult.value;
    if (board == null) {
        return err(BOARD_NOT_FOUND_ERROR);
    }
    // Ignore tokens for boards that can be read by slug.
    if (board.viewPermission !== ViewPermission.ByToken) {
        return ok(board);
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
