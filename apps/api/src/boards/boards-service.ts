import type { ServiceError, Board, StoreError, Result } from "common";
import {
    err,
    ok,
    ViewPermission,
    BOARD_NOT_FOUND_ERROR,
    ValidationError,
    Task,
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

const _delete = (
    slug: string,
    token: string
): Promise<Result<true, ServiceError>> =>
    Task.fromPromise(() => authorizeWritePermission({ slug, token }))
        .andThen((board) => BoardsStore.delete(board.id))
        .map(() => true as const)
        .toPromise();

const getAllPublic = async (): Promise<Result<Board[], StoreError>> =>
    BoardsStore.getAllPublic();

const getBySlug = (slug: string): Promise<Result<Board, ServiceError>> =>
    Task.fromPromise(() => BoardsStore.findBySlug(slug))
        .andThen((board) =>
            board === null ||
            !VALID_GET_BY_SLUG_PERMISSIONS.includes(
                board.viewPermission as ViewPermission
            )
                ? err(BOARD_NOT_FOUND_ERROR)
                : ok(board)
        )
        .toPromise();

const getByToken = (
    options: GetBoardByTokenOptions
): Promise<Result<Board, ServiceError>> => {
    const { id = "", slug = "", token } = options;
    const hasId = !isEmpty(id);
    const hasSlug = !isEmpty(slug);
    if (!hasId && !hasSlug) {
        return Task.fromResult(
            err(new ValidationError("An id or slug is required"))
        ).toPromise();
    }

    return Task.fromPromise(() =>
        hasId ? BoardsStore.findById(id) : BoardsStore.findBySlug(slug)
    )
        .andThen((board) => {
            if (board === null) {
                return err(BOARD_NOT_FOUND_ERROR);
            }
            return Task.fromPromise(() =>
                BoardTokensStore.findByBoardIdAndToken(board.id, token)
            ).andThen((boardToken) =>
                boardToken === null ? err(BOARD_NOT_FOUND_ERROR) : ok(board)
            );
        })
        .toPromise();
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

const update = (
    input: UpdateBoardOptions
): Promise<Result<Board, ServiceError>> => {
    const { originalSlug, token, ...updatedBoard } = input;
    return Task.fromPromise(() =>
        authorizeWritePermission({ slug: originalSlug, token })
    )
        .andThen((board) => BoardsStore.update(board.id, updatedBoard))
        .toPromise();
};

const get = (
    slug: string,
    token?: string
): Promise<Result<Board, ServiceError>> =>
    Task.fromPromise(() => BoardsStore.findBySlug(slug))
        .andThen((board) => {
            if (board === null) {
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
        })
        .toPromise();

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
