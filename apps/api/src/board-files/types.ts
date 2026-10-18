import type { GetBoardByTokenOptions } from "@/boards/types";

type UploadedBoardFile = {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
    size: number;
};

type InsertBoardFileOptions = {
    boardId: string;
    displayName: string;
    emoji: string;
    file: UploadedBoardFile;
    size: number;
};

type UpdateStoredBoardFileOptions = Partial<
    Omit<InsertBoardFileOptions, "boardId">
>;

type CreateBoardFileOptions = {
    boardSlug: string;
    displayName: string;
    emoji: string | undefined;
    file: UploadedBoardFile;
    token: string;
};

type BulkCreateBoardFileOptions = {
    boardSlug: string;
    displayNames: string[];
    emojis: string[];
    files: UploadedBoardFile[];
    token: string;
};

type ListBoardFilesByTokenOptions = GetBoardByTokenOptions;

type GetBoardFileOptions = {
    boardSlug: string;
    id: string;
    token?: string;
};

type UpdateBoardFileOptions = {
    /**
     * Slug of the related board
     */
    boardSlug: string;

    /**
     * Updated display name field
     */
    displayName?: string;

    /**
     * Updated emoji field
     */
    emoji?: null | string;

    /**
     * Replacement file
     */
    file?: UploadedBoardFile;

    /**
     * Id of the record to update
     */
    id: string;

    /**
     * Token to authorize the board access with.
     */
    token: string;
};

export type {
    BulkCreateBoardFileOptions,
    CreateBoardFileOptions,
    GetBoardFileOptions,
    InsertBoardFileOptions,
    ListBoardFilesByTokenOptions,
    UpdateBoardFileOptions,
    UpdateStoredBoardFileOptions,
    UploadedBoardFile,
};
