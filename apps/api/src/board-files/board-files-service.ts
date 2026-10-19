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
    Task,
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
    return Task.fromPromise(() =>
        BoardsService.getByToken({ slug: boardSlug, token })
    )
        .andThen((board) =>
            verifyRemainingSize(
                board.id,
                sumBy(files, (file) => file.size)
            ).andThen(() =>
                BoardFilesStore.bulkInsert(
                    files.map((file, index) => ({
                        boardId: board.id,
                        displayName: displayNames[index],
                        emoji: normalizeEmoji(emojis[index]),
                        file,
                        size: file.size,
                    }))
                )
            )
        )
        .toPromise();
};

const _delete = (
    id: string,
    boardSlug: string,
    token: string
): Promise<Result<true, ServiceError>> =>
    getWritableFile(id, boardSlug, token)
        .andThen((boardFile) => BoardFilesStore.delete(boardFile.id))
        .map(() => true as const)
        .toPromise();

const insert = (
    options: CreateBoardFileOptions
): Promise<Result<BoardFile, ServiceError>> => {
    const { boardSlug, displayName, emoji, file, token } = options;
    return Task.fromPromise(() =>
        bulkInsert({
            boardSlug,
            displayNames: [displayName],
            emojis: [emoji ?? "null"],
            files: [file],
            token,
        })
    )
        .map((boardFiles) => boardFiles[0])
        .toPromise();
};

const getWritableFile = (
    id: string,
    boardSlug: string,
    token: string
): Task<BoardFile, ServiceError> => {
    if (!isString(token) || isEmpty(token)) {
        return Task.fromResult(err(BOARD_NOT_FOUND_ERROR));
    }

    return Task.fromPromise(() =>
        BoardsService.getByToken({ slug: boardSlug, token })
    ).andThen((board) => getByIdAndBoardId(id, board.id));
};

const get = (
    options: GetBoardFileOptions
): Promise<Result<BoardFile, ServiceError>> => {
    const { boardSlug, id, token } = options;
    if (token !== undefined && !isString(token)) {
        return Task.fromResult(err(BOARD_NOT_FOUND_ERROR)).toPromise();
    }

    return Task.fromPromise(() =>
        isEmpty(token)
            ? BoardsService.getBySlug(boardSlug)
            : BoardsService.getByToken({ slug: boardSlug, token: token! })
    )
        .andThen((board) => getByIdAndBoardId(id, board.id))
        .toPromise();
};

const getByIdAndBoardId = (
    id: string,
    boardId: string
): Task<BoardFile, ServiceError> =>
    Task.fromPromise(() => BoardFilesStore.findById(id)).andThen((boardFile) =>
        boardFile === null || boardFile.boardId !== boardId
            ? err(BOARD_NOT_FOUND_ERROR)
            : ok(boardFile)
    );

const listByBoardSlug = (
    boardSlug: string
): Promise<Result<PresignedBoardFile[], ServiceError>> =>
    Task.fromPromise(() => BoardsService.getBySlug(boardSlug))
        .andThen((board) => BoardFilesStore.listWithPresignedUrls(board.id))
        .toPromise();

const listByToken = (
    options: ListBoardFilesByTokenOptions
): Promise<Result<PresignedBoardFile[], ServiceError>> =>
    Task.fromPromise(() => BoardsService.getByToken(options))
        .andThen((board) => BoardFilesStore.listWithPresignedUrls(board.id))
        .toPromise();

const update = (
    options: UpdateBoardFileOptions
): Promise<Result<BoardFile, ServiceError>> => {
    const { boardSlug, displayName, emoji, file, id, token } = options;
    return getWritableFile(id, boardSlug, token)
        .andThen((boardFile) => {
            let updatedBoardFile: UpdateStoredBoardFileOptions = {};
            if (!isEmpty(displayName)) {
                updatedBoardFile = {
                    ...updatedBoardFile,
                    displayName: displayName!,
                };
            }
            if (!isEmpty(emoji)) {
                updatedBoardFile = {
                    ...updatedBoardFile,
                    emoji: normalizeEmoji(emoji),
                };
            }
            if (file === undefined) {
                return BoardFilesStore.update(id, updatedBoardFile);
            }

            const additionalSizeInBytes = Math.max(
                file.size - boardFile.size,
                0
            );
            return verifyRemainingSize(
                boardFile.boardId,
                additionalSizeInBytes
            ).andThen(() =>
                BoardFilesStore.update(id, {
                    ...updatedBoardFile,
                    file,
                    size: file.size,
                })
            );
        })
        .toPromise();
};

const verifyRemainingSize = (
    boardId: string,
    incomingSizeInBytes: number
): Task<void, ServiceError> =>
    Task.fromPromise(() => BoardFilesStore.listByBoardId(boardId)).andThen(
        (boardFiles): Result<void, ServiceError> => {
            const sizeInBytes = sumBy(
                boardFiles,
                (boardFile) => boardFile.size
            );
            const remainingSizeInBytes = Math.max(
                MAXIMUM_BOARD_SIZE_IN_BYTES - sizeInBytes,
                0
            );
            if (remainingSizeInBytes < incomingSizeInBytes) {
                return err(
                    new ValidationError(
                        `The file(s) provided exceed the remaining size capacity for the board (${formatFileSize(remainingSizeInBytes)})`
                    )
                );
            }
            return ok(undefined);
        }
    );

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
