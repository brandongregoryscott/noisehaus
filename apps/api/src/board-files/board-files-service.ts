import type {
    Result,
    ServiceError,
    BoardFile,
    PresignedBoardFile,
} from "common";
import {
    MAXIMUM_BOARD_SIZE_IN_BYTES,
    MAX_FILE_COUNT_PER_UPLOAD,
    err,
    ok,
    BOARD_NOT_FOUND_ERROR,
    ValidationError,
} from "common";
import { isEmpty, isString, sumBy } from "lodash-es";
import type {
    UploadedBoardFile,
    UpdateStoredBoardFileOptions,
} from "@/board-files/board-files-store";
import type { GetBoardByTokenOptions } from "@/boards/boards-service";
import { BoardFilesStore } from "@/board-files/board-files-store";
import { BoardsService } from "@/boards/boards-service";
import { formatFileSize } from "@/utilities/file-utilities";

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

const normalizeEmoji = (emoji: null | string | undefined): string =>
    emoji == null || emoji === "null" ? "" : emoji;

const bulkInsert = async (
    options: BulkCreateBoardFileOptions
): Promise<Result<BoardFile[], ServiceError>> => {
    const { boardSlug, displayNames, emojis, files, token } = options;
    if (
        isEmpty(files) ||
        files.length > MAX_FILE_COUNT_PER_UPLOAD ||
        displayNames.length !== files.length ||
        emojis.length !== files.length
    ) {
        return err(
            new ValidationError(
                `Each uploaded file must have a name and emoji, with at most ${MAX_FILE_COUNT_PER_UPLOAD} files per upload`
            )
        );
    }
    const board = await BoardsService.getByToken({ slug: boardSlug, token });

    if (board.isErr) {
        return board;
    }
    const quota = await verifyRemainingSize(
        board.value.id,
        sumBy(files, (file) => file.size)
    );
    if (quota.isErr) {
        return quota;
    }

    return BoardFilesStore.bulkInsert(
        files.map((file, index) => ({
            boardId: board.value.id,
            displayName: displayNames[index],
            emoji: normalizeEmoji(emojis[index]),
            file,
            size: file.size,
        }))
    );
};

const _delete = async (
    id: string,
    boardSlug: string,
    token: string
): Promise<Result<true, ServiceError>> => {
    const boardFile = await getWritableFile(id, boardSlug, token);
    if (boardFile.isErr) {
        return boardFile;
    }
    const deleted = await BoardFilesStore.delete(boardFile.value.id);
    return deleted.isErr ? deleted : ok(true);
};

const insert = async (
    options: CreateBoardFileOptions
): Promise<Result<BoardFile, ServiceError>> => {
    const { boardSlug, displayName, emoji, file, token } = options;
    const result = await bulkInsert({
        boardSlug,
        displayNames: [displayName],
        emojis: [emoji ?? "null"],
        files: [file],
        token,
    });
    return result.isErr ? result : ok(result.value[0]);
};

const getWritableFile = async (
    id: string,
    boardSlug: string,
    token: string
): Promise<Result<BoardFile, ServiceError>> => {
    if (!isString(token) || isEmpty(token)) {
        return err(BOARD_NOT_FOUND_ERROR);
    }

    const board = await BoardsService.getByToken({ slug: boardSlug, token });
    if (board.isErr) {
        return board;
    }
    return getByIdAndBoardId(id, board.value.id);
};

const get = async (
    options: GetBoardFileOptions
): Promise<Result<BoardFile, ServiceError>> => {
    const { boardSlug, id, token } = options;
    if (token !== undefined && !isString(token)) {
        return err(BOARD_NOT_FOUND_ERROR);
    }

    const board = await (isEmpty(token)
        ? BoardsService.getBySlug(boardSlug)
        : BoardsService.getByToken({ slug: boardSlug, token: token! }));

    if (board.isErr) {
        return board;
    }
    return getByIdAndBoardId(id, board.value.id);
};

const getByIdAndBoardId = async (
    id: string,
    boardId: string
): Promise<Result<BoardFile, ServiceError>> => {
    const boardFile = await BoardFilesStore.findById(id);
    if (boardFile.isErr) {
        return boardFile;
    }
    if (boardFile.value === null || boardFile.value.boardId !== boardId) {
        return err(BOARD_NOT_FOUND_ERROR);
    }

    return ok(boardFile.value);
};

const listByBoardSlug = async (
    boardSlug: string
): Promise<Result<PresignedBoardFile[], ServiceError>> => {
    const board = await BoardsService.getBySlug(boardSlug);
    if (board.isErr) {
        return board;
    }
    return BoardFilesStore.listWithPresignedUrls(board.value.id);
};

const listByToken = async (
    options: ListBoardFilesByTokenOptions
): Promise<Result<PresignedBoardFile[], ServiceError>> => {
    const board = await BoardsService.getByToken(options);
    if (board.isErr) {
        return board;
    }
    return BoardFilesStore.listWithPresignedUrls(board.value.id);
};

const update = async (
    options: UpdateBoardFileOptions
): Promise<Result<BoardFile, ServiceError>> => {
    const { boardSlug, displayName, emoji, file, id, token } = options;
    const boardFile = await getWritableFile(id, boardSlug, token);

    if (boardFile.isErr) {
        return boardFile;
    }

    let updatedBoardFile: UpdateStoredBoardFileOptions = {};
    if (!isEmpty(displayName)) {
        updatedBoardFile = { ...updatedBoardFile, displayName: displayName! };
    }

    if (!isEmpty(emoji)) {
        updatedBoardFile = {
            ...updatedBoardFile,
            emoji: normalizeEmoji(emoji),
        };
    }

    if (file !== undefined) {
        const additionalSizeInBytes = Math.max(
            file.size - boardFile.value.size,
            0
        );
        const quota = await verifyRemainingSize(
            boardFile.value.boardId,
            additionalSizeInBytes
        );
        if (quota.isErr) {
            return quota;
        }

        return BoardFilesStore.update(id, {
            ...updatedBoardFile,
            file,
            size: file.size,
        });
    }

    return BoardFilesStore.update(id, updatedBoardFile);
};

const verifyRemainingSize = async (
    boardId: string,
    incomingSizeInBytes: number
): Promise<Result<void, ServiceError>> => {
    const boardFiles = await BoardFilesStore.listByBoardId(boardId);
    if (boardFiles.isErr) {
        return boardFiles;
    }
    const sizeInBytes = sumBy(boardFiles.value, (boardFile) => boardFile.size);
    const remainingSizeInBytes = Math.max(
        MAXIMUM_BOARD_SIZE_IN_BYTES - sizeInBytes,
        0
    );
    if (remainingSizeInBytes < incomingSizeInBytes) {
        return err(
            new ValidationError(
                `The file(s) provided exceed the remaining size capacity for the board (${formatFileSize(
                    remainingSizeInBytes
                )})`
            )
        );
    }
    return ok(undefined);
};

const BoardFilesService = {
    bulkInsert,
    delete: _delete,
    get,
    insert,
    listByBoardSlug,
    listByToken,
    update,
};

export type {
    BulkCreateBoardFileOptions,
    CreateBoardFileOptions,
    GetBoardFileOptions,
    ListBoardFilesByTokenOptions,
    UpdateBoardFileOptions,
};
export { BoardFilesService };
