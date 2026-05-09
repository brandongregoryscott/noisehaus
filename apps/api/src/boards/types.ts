import type { Board } from "common";

type CreateBoardOptions = Pick<Board, "name" | "slug">;

type CreateBoardResult = {
    token: string;
} & Board;

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

export type {
    CreateBoardOptions,
    CreateBoardResult,
    GetBoardByTokenOptions,
    UpdateBoardOptions,
};
