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
import { SupabaseClient } from "@/supabase-client";
import {
    BOARD_NOT_FOUND_ERROR,
    isPostgrestError,
    isUniqueConstraintError,
    UnexpectedNullError,
    ValidationError,
} from "@/utilities/errors";
import { randomSuffix } from "@/utilities/string-utils";

type InsertOptions = {
    /**
     * Attempt to create the board. If a unique constraint error is raised, the creation will be attempted
     * again with a randomized suffix appended to the original slug.
     */
    attempt?: number;
} & CreateBoardOptions;

const MAX_CREATE_ATTEMPTS = 5;

const VALID_GET_BY_SLUG_PERMISSIONS = [
    ViewPermission.Public,
    ViewPermission.BySlug,
];

const _delete = async (slug: string, token: string): Promise<true> => {
    await authorizeWritePermissionOrThrow({ slug, token });
    await Promise.all([
        await BoardFilesStore.deleteAll(slug, token),
        await unsafe__delete(slug),
    ]);

    return true;
};

const getAllPublic = async (): Promise<Board[]> => unsafe__getAllPublic();

const getBySlug = async (slug: string): Promise<Board> => {
    const board = await unsafe__getBySlug(slug);

    if (
        board === null ||
        !VALID_GET_BY_SLUG_PERMISSIONS.includes(
            board.view_permission as ViewPermission
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

    const [board, boardToken] = await Promise.all([
        hasId ? unsafe__getById(id) : unsafe__getBySlug(slug),
        hasId
            ? BoardTokensStore.unsafe__getByBoardIdAndToken(id, token)
            : BoardTokensStore.unsafe__getByBoardSlugAndToken(slug, token),
    ]);

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
            isPostgrestError(error) &&
            isUniqueConstraintError(error) &&
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
    await table().delete().throwOnError().eq("slug", slug);
};

const unsafe__getAllPublic = async (): Promise<Board[]> => {
    const { data } = await table()
        .select("*")
        .throwOnError()
        .filter("view_permission", "eq", ViewPermission.Public);

    return data ?? [];
};

const unsafe__getById = async (id: string): Promise<Board | null> => {
    const { data } = await table()
        .select("*")
        .throwOnError()
        .eq("id", id)
        .maybeSingle();

    return data;
};

const unsafe__getBySlug = async (slug: string): Promise<Board | null> => {
    const { data } = await table()
        .select("*")
        .throwOnError()
        .eq("slug", slug)
        .maybeSingle();

    return data;
};

const unsafe__insert = async (
    input: CreateBoardOptions
): Promise<CreateBoardResult> => {
    const { data: board } = await table()
        .insert(input)
        .throwOnError()
        .select("*")
        .single();

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

    return { ...board, token: boardToken.token };
};

const unsafe__update = async (
    input: Omit<UpdateBoardOptions, "token">
): Promise<Board> => {
    const { originalSlug, ...updatedBoard } = input;
    const { data } = await table()
        .update(updatedBoard)
        .eq("slug", originalSlug)
        .throwOnError()
        .select("*")
        .single();

    return data!;
};

/**
 * Alias for the `getByToken` function. This function throws if the provided slug/id does not
 * match the provided token.
 */
const authorizeWritePermissionOrThrow = getByToken;

const table = () => SupabaseClient.from("board");

const BoardsStore = {
    authorizeWritePermissionOrThrow,
    delete: _delete,
    getAllPublic,
    getBySlug,
    getByToken,
    insert,
    MAX_CREATE_ATTEMPTS,
    table,
    unsafe__delete,
    unsafe__getAllPublic,
    unsafe__getBySlug,
    unsafe__insert,
    unsafe__update,
    update,
};

export { BoardsStore };
