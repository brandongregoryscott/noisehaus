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
    const boardResult = await BoardsService.getByToken({
        slug: boardSlug,
        token,
    });

    if (boardResult.isErr) {
        return boardResult;
    }
    const board = boardResult.value;
    const quotaResult = await verifyRemainingSize(
        board.id,
        sumBy(files, (file) => file.size)
    );
    if (quotaResult.isErr) {
        return quotaResult;
    }

    return BoardFilesStore.bulkInsert(
        files.map((file, index) => ({
            boardId: board.id,
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
    const boardFileResult = await getWritableFile(id, boardSlug, token);
    if (boardFileResult.isErr) {
        return boardFileResult;
    }
    const boardFile = boardFileResult.value;
    const deleteResult = await BoardFilesStore.delete(boardFile.id);
    return deleteResult.isErr ? deleteResult : ok(true);
};

const insert = async (
    options: CreateBoardFileOptions
): Promise<Result<BoardFile, ServiceError>> => {
    const { boardSlug, displayName, emoji, file, token } = options;
    const boardFilesResult = await bulkInsert({
        boardSlug,
        displayNames: [displayName],
        emojis: [emoji ?? "null"],
        files: [file],
        token,
    });
    return boardFilesResult.isErr
        ? boardFilesResult
        : ok(boardFilesResult.value[0]);
};

const getWritableFile = async (
    id: string,
    boardSlug: string,
    token: string
): Promise<Result<BoardFile, ServiceError>> => {
    if (!isString(token) || isEmpty(token)) {
        return err(BOARD_NOT_FOUND_ERROR);
    }

    const boardResult = await BoardsService.getByToken({
        slug: boardSlug,
        token,
    });
    if (boardResult.isErr) {
        return boardResult;
    }
    const board = boardResult.value;
    return getByIdAndBoardId(id, board.id);
};

const get = async (
    options: GetBoardFileOptions
): Promise<Result<BoardFile, ServiceError>> => {
    const { boardSlug, id, token } = options;
    if (token !== undefined && !isString(token)) {
        return err(BOARD_NOT_FOUND_ERROR);
    }

    const boardResult = await (isEmpty(token)
        ? BoardsService.getBySlug(boardSlug)
        : BoardsService.getByToken({ slug: boardSlug, token: token! }));

    if (boardResult.isErr) {
        return boardResult;
    }
    const board = boardResult.value;
    return getByIdAndBoardId(id, board.id);
};

const getByIdAndBoardId = async (
    id: string,
    boardId: string
): Promise<Result<BoardFile, ServiceError>> => {
    const boardFileResult = await BoardFilesStore.findById(id);
    if (boardFileResult.isErr) {
        return boardFileResult;
    }
    const boardFile = boardFileResult.value;
    if (boardFile === null || boardFile.boardId !== boardId) {
        return err(BOARD_NOT_FOUND_ERROR);
    }

    return ok(boardFile);
};

const listByBoardSlug = async (
    boardSlug: string
): Promise<Result<PresignedBoardFile[], ServiceError>> => {
    const boardResult = await BoardsService.getBySlug(boardSlug);
    if (boardResult.isErr) {
        return boardResult;
    }
    const board = boardResult.value;
    return BoardFilesStore.listWithPresignedUrls(board.id);
};

const listByToken = async (
    options: ListBoardFilesByTokenOptions
): Promise<Result<PresignedBoardFile[], ServiceError>> => {
    const boardResult = await BoardsService.getByToken(options);
    if (boardResult.isErr) {
        return boardResult;
    }
    const board = boardResult.value;
    return BoardFilesStore.listWithPresignedUrls(board.id);
};

const update = async (
    options: UpdateBoardFileOptions
): Promise<Result<BoardFile, ServiceError>> => {
    const { boardSlug, displayName, emoji, file, id, token } = options;
    const boardFileResult = await getWritableFile(id, boardSlug, token);

    if (boardFileResult.isErr) {
        return boardFileResult;
    }
    const boardFile = boardFileResult.value;

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
        const additionalSizeInBytes = Math.max(file.size - boardFile.size, 0);
        const quotaResult = await verifyRemainingSize(
            boardFile.boardId,
            additionalSizeInBytes
        );
        if (quotaResult.isErr) {
            return quotaResult;
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
    const boardFilesResult = await BoardFilesStore.listByBoardId(boardId);
    if (boardFilesResult.isErr) {
        return boardFilesResult;
    }
    const boardFiles = boardFilesResult.value;
    const sizeInBytes = sumBy(boardFiles, (boardFile) => boardFile.size);
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
