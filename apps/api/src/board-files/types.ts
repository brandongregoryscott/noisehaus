import type { GetBoardByTokenOptions } from "@/boards/types";
import type { MulterFile } from "@/storage/types";

type CreateBoardFileOptions = {
    boardSlug: string;
    displayName: string;
    emoji: string | undefined;
    file: MulterFile;
    token: string;
};

type BulkCreateBoardFileOptions = {
    boardSlug: string;
    displayNames: string[];
    emojis: string[];
    files: MulterFile[];
    token: string;
};

type ListBoardFilesByTokenOptions = GetBoardByTokenOptions;

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
    file?: MulterFile;

    /**
     * Id of the record to update
     */
    id: string;

    /**
     * Token to authorize the board access with.
     */
    token: string;
};

type UnsafeCreateOptions = {
    boardId: string;
    boardSlug: string;
    displayName: string;
    emoji: string | undefined;
    file: MulterFile;
};

export type {
    BulkCreateBoardFileOptions,
    CreateBoardFileOptions,
    ListBoardFilesByTokenOptions,
    UnsafeCreateOptions,
    UpdateBoardFileOptions,
};
