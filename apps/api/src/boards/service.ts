import type { Board } from "common";
import { ViewPermission } from "common";
import { isEmpty } from "lodash-es";
import type {
    CreateBoardOptions,
    CreateBoardResult,
    GetBoardByTokenOptions,
    UpdateBoardOptions,
} from "@/boards/types";
import { BoardTokensStore } from "@/board-tokens/store";
import { BoardsStore } from "@/boards/store";
import {
    BOARD_NOT_FOUND_ERROR,
    UniqueConstraintError,
    ValidationError,
} from "@/utilities/errors";
import { randomSuffix } from "@/utilities/string-utils";

type InsertOptions = { attempt?: number } & CreateBoardOptions;
const MAX_CREATE_ATTEMPTS = 5;

const VALID_GET_BY_SLUG_PERMISSIONS = [
    ViewPermission.Public,
    ViewPermission.BySlug,
];

const _delete = async (slug: string, token: string): Promise<true> => {
    const board = await authorizeWritePermissionOrThrow({ slug, token });

    await BoardsStore.delete(board.id);

    return true;
};

const getAllPublic = async (): Promise<Board[]> => BoardsStore.getAllPublic();

const getBySlug = async (slug: string): Promise<Board> => {
    const board = await BoardsStore.findBySlug(slug);

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
        ? await BoardsStore.findById(id)
        : await BoardsStore.findBySlug(slug);
    const boardToken =
        board == null
            ? null
            : await BoardTokensStore.findByBoardIdAndToken(board.id, token);

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
        return await BoardsStore.createWithInitialToken({
            name,
            slug,
            viewPermission: ViewPermission.BySlug,
        });
    } catch (error) {
        if (
            error instanceof UniqueConstraintError &&
            error.field === "slug" &&
            attempt < MAX_CREATE_ATTEMPTS
        ) {
            return insert({ ...options, attempt: attempt + 1 });
        }

        throw error;
    }
};

const update = async (input: UpdateBoardOptions): Promise<Board> => {
    const { originalSlug, token, ...updatedBoard } = input;
    const board = await authorizeWritePermissionOrThrow({
        slug: originalSlug,
        token,
    });
    return BoardsStore.update(board.id, updatedBoard);
};

const get = async (slug: string, token?: string): Promise<Board> => {
    const board = await BoardsStore.findBySlug(slug);
    if (board == null) {
        throw BOARD_NOT_FOUND_ERROR;
    }

    // Ignore tokens for boards that can be read by slug.
    if (board.viewPermission !== ViewPermission.ByToken) {
        return board;
    }

    if (isEmpty(token)) {
        throw BOARD_NOT_FOUND_ERROR;
    }

    await getByToken({ slug, token: token! });
    return board;
};

const authorizeWritePermissionOrThrow = getByToken;
const BoardsService = {
    authorizeWritePermissionOrThrow,
    delete: _delete,
    get,
    getAllPublic,
    getBySlug,
    getByToken,
    insert,
    MAX_CREATE_ATTEMPTS,
    update,
};

export { BoardsService };
