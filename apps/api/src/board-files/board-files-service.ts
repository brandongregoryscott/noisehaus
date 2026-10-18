import type { BoardFile, PresignedBoardFile } from "common";
import { MAXIMUM_BOARD_SIZE_IN_BYTES, MAX_FILE_COUNT_PER_UPLOAD } from "common";
import { isEmpty, isString, sumBy } from "lodash-es";
import type {
    UploadedBoardFile,
    UpdateStoredBoardFileOptions,
} from "@/board-files/board-files-store";
import type { GetBoardByTokenOptions } from "@/boards/boards-service";
import { BoardFilesStore } from "@/board-files/board-files-store";
import { BoardsService } from "@/boards/boards-service";
import { BOARD_NOT_FOUND_ERROR, ValidationError } from "@/utilities/errors";
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
): Promise<BoardFile[]> => {
    const { boardSlug, displayNames, emojis, files, token } = options;
    if (
        isEmpty(files) ||
        files.length > MAX_FILE_COUNT_PER_UPLOAD ||
        displayNames.length !== files.length ||
        emojis.length !== files.length
    ) {
        throw new ValidationError(
            `Each uploaded file must have a name and emoji, with at most ${MAX_FILE_COUNT_PER_UPLOAD} files per upload`
        );
    }
    const board = await BoardsService.getByToken({ slug: boardSlug, token });

    await verifyRemainingSize(
        board.id,
        sumBy(files, (file) => file.size)
    );

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
): Promise<true> => {
    const boardFile = await getWritableFile(id, boardSlug, token);
    await BoardFilesStore.delete(boardFile.id);
    return true;
};

const insert = async (options: CreateBoardFileOptions): Promise<BoardFile> => {
    const { boardSlug, displayName, emoji, file, token } = options;
    const [boardFile] = await bulkInsert({
        boardSlug,
        displayNames: [displayName],
        emojis: [emoji ?? "null"],
        files: [file],
        token,
    });
    return boardFile;
};

const getWritableFile = async (
    id: string,
    boardSlug: string,
    token: string
): Promise<BoardFile> => {
    if (!isString(token) || isEmpty(token)) {
        throw BOARD_NOT_FOUND_ERROR;
    }

    const board = await BoardsService.getByToken({ slug: boardSlug, token });
    return getByIdAndBoardId(id, board.id);
};

const get = async (options: GetBoardFileOptions): Promise<BoardFile> => {
    const { boardSlug, id, token } = options;
    if (token !== undefined && !isString(token)) {
        throw BOARD_NOT_FOUND_ERROR;
    }

    const board = await (isEmpty(token)
        ? BoardsService.getBySlug(boardSlug)
        : BoardsService.getByToken({ slug: boardSlug, token: token! }));

    return getByIdAndBoardId(id, board.id);
};

const getByIdAndBoardId = async (
    id: string,
    boardId: string
): Promise<BoardFile> => {
    const boardFile = await BoardFilesStore.findById(id);
    if (boardFile === null || boardFile.boardId !== boardId) {
        throw BOARD_NOT_FOUND_ERROR;
    }

    return boardFile;
};

const listByBoardSlug = async (
    boardSlug: string
): Promise<PresignedBoardFile[]> => {
    const board = await BoardsService.getBySlug(boardSlug);
    return BoardFilesStore.listWithPresignedUrls(board.id);
};

const listByToken = async (
    options: ListBoardFilesByTokenOptions
): Promise<PresignedBoardFile[]> => {
    const board = await BoardsService.getByToken(options);
    return BoardFilesStore.listWithPresignedUrls(board.id);
};

const update = async (options: UpdateBoardFileOptions): Promise<BoardFile> => {
    const { boardSlug, displayName, emoji, file, id, token } = options;
    const boardFile = await getWritableFile(id, boardSlug, token);

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
        await verifyRemainingSize(boardFile.boardId, additionalSizeInBytes);

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
): Promise<void> => {
    const boardFiles = await BoardFilesStore.listByBoardId(boardId);
    const sizeInBytes = sumBy(boardFiles, (boardFile) => boardFile.size);
    const remainingSizeInBytes = Math.max(
        MAXIMUM_BOARD_SIZE_IN_BYTES - sizeInBytes,
        0
    );
    if (remainingSizeInBytes < incomingSizeInBytes) {
        throw new ValidationError(
            `The file(s) provided exceed the remaining size capacity for the board (${formatFileSize(
                remainingSizeInBytes
            )})`
        );
    }
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
