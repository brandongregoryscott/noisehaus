import type { BoardFile, PresignedBoardFile } from "common";
import { MAXIMUM_BOARD_SIZE_IN_BYTES, MAX_FILE_COUNT_PER_UPLOAD } from "common";
import { isEmpty, sumBy } from "lodash-es";
import type {
    BulkCreateBoardFileOptions,
    CreateBoardFileOptions,
    GetBoardFileOptions,
    ListBoardFilesByTokenOptions,
    UpdateBoardFileOptions,
} from "@/board-files/types";
import { BoardsStore } from "@/boards/store";
import { PocketBaseClient } from "@/pocketbase-client";
import {
    BOARD_NOT_FOUND_ERROR,
    UnexpectedNullError,
    ValidationError,
} from "@/utilities/errors";
import { formatFileSize } from "@/utilities/file-utilities";

type BoardFileRecord = {
    boardId: string;
    createdAt: string;
    displayName: string;
    emoji: string;
    file?: string;
    id: string;
    position: number;
    size: number;
    updatedAt: string;
};

const BOARD_FILE_COLLECTION = "boardFiles";

const normalizeEmoji = (emoji: null | string | undefined): string =>
    emoji == null || emoji === "null" ? "" : emoji;

const bulkInsert = async (
    options: BulkCreateBoardFileOptions
): Promise<BoardFile[]> => {
    const { boardSlug, displayNames, emojis, files, token } = options;
    if (
        files.length === 0 ||
        files.length > MAX_FILE_COUNT_PER_UPLOAD ||
        displayNames.length !== files.length ||
        emojis.length !== files.length
    ) {
        throw new ValidationError(
            `Each uploaded file must have a name and emoji, with at most ${MAX_FILE_COUNT_PER_UPLOAD} files per upload`
        );
    }
    const board = await BoardsStore.getByToken({ slug: boardSlug, token });

    await unsafe__verifyRemainingSize(
        board.id,
        sumBy(files, (file) => file.size)
    );

    const records = await PocketBaseClient.createRecords<BoardFileRecord[]>(
        files.map((file, index) => ({
            collection: BOARD_FILE_COLLECTION,
            data: toFormData({
                boardId: board.id,
                displayName: displayNames[index],
                emoji: normalizeEmoji(emojis[index]),
                file,
                size: file.size,
            }),
        }))
    );

    return records.map(toBoardFile);
};

const _delete = async (
    id: string,
    boardSlug: string,
    token: string
): Promise<true> => {
    const boardFile = await getWritableFile(id, boardSlug, token);
    await PocketBaseClient.deleteRecord(BOARD_FILE_COLLECTION, boardFile.id);
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
    if (typeof token !== "string" || isEmpty(token)) {
        throw BOARD_NOT_FOUND_ERROR;
    }

    const board = await BoardsStore.getByToken({ slug: boardSlug, token });
    return getByIdAndBoardId(id, board.id);
};

const get = async (options: GetBoardFileOptions): Promise<BoardFile> => {
    const { boardSlug, id, token } = options;
    if (token !== undefined && typeof token !== "string") {
        throw BOARD_NOT_FOUND_ERROR;
    }

    const board = await (isEmpty(token)
        ? BoardsStore.getBySlug(boardSlug)
        : BoardsStore.getByToken({ slug: boardSlug, token: token! }));

    return getByIdAndBoardId(id, board.id);
};

const getByIdAndBoardId = async (
    id: string,
    boardId: string
): Promise<BoardFile> => {
    const boardFile = await unsafe__getById(id);
    if (boardFile === null || boardFile.boardId !== boardId) {
        throw BOARD_NOT_FOUND_ERROR;
    }

    return boardFile;
};

const listByBoardSlug = async (
    boardSlug: string
): Promise<PresignedBoardFile[]> => {
    const board = await BoardsStore.getBySlug(boardSlug);
    return unsafe__listWithPresignedUrls(board.id);
};

const listByToken = async (
    options: ListBoardFilesByTokenOptions
): Promise<PresignedBoardFile[]> => {
    const board = await BoardsStore.getByToken(options);
    return unsafe__listWithPresignedUrls(board.id);
};

const unsafe__listWithPresignedUrls = async (
    boardId: string
): Promise<PresignedBoardFile[]> => {
    const boardFiles = await unsafe__listRecordsByBoardId(boardId);
    const token = await PocketBaseClient.getFileToken();

    return boardFiles.map((boardFile) => {
        if (isEmpty(boardFile.file)) {
            throw new UnexpectedNullError("file");
        }

        const signedUrl = PocketBaseClient.getFileUrl(
            BOARD_FILE_COLLECTION,
            boardFile.id,
            boardFile.file!,
            token
        );

        return { ...toBoardFile(boardFile), signedUrl };
    });
};

const update = async (options: UpdateBoardFileOptions): Promise<BoardFile> => {
    const { boardSlug, displayName, emoji, file, id, token } = options;
    const boardFile = await getWritableFile(id, boardSlug, token);

    let updatedBoardFile: Record<string, unknown> = {};
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
        await unsafe__verifyRemainingSize(
            boardFile.boardId,
            additionalSizeInBytes
        );

        const formData = toFormData({
            ...updatedBoardFile,
            file,
            size: file.size,
        });
        const record = await PocketBaseClient.updateRecord<BoardFileRecord>(
            BOARD_FILE_COLLECTION,
            id,
            formData
        );
        return toBoardFile(record);
    }

    const record = await PocketBaseClient.updateRecord<BoardFileRecord>(
        BOARD_FILE_COLLECTION,
        id,
        updatedBoardFile
    );

    return toBoardFile(record);
};

const unsafe__getById = async (id: string): Promise<BoardFile | null> => {
    const record =
        await PocketBaseClient.getFirstRecordByFilter<BoardFileRecord>(
            BOARD_FILE_COLLECTION,
            `id = ${PocketBaseClient.escapeFilterValue(id)}`
        );

    return record == null ? null : toBoardFile(record);
};

const unsafe__listByBoardId = async (boardId: string): Promise<BoardFile[]> => {
    const records = await unsafe__listRecordsByBoardId(boardId);
    return records.map(toBoardFile);
};

const unsafe__listRecordsByBoardId = async (
    boardId: string
): Promise<BoardFileRecord[]> =>
    PocketBaseClient.listRecords<BoardFileRecord>(BOARD_FILE_COLLECTION, {
        filter: `boardId = ${PocketBaseClient.escapeFilterValue(boardId)}`,
        sort: "position,createdAt",
    });

const unsafe__verifyRemainingSize = async (
    boardId: string,
    incomingSizeInBytes: number
): Promise<void> => {
    const boardFiles = await unsafe__listByBoardId(boardId);
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

const toFormData = (input: Record<string, unknown>): FormData => {
    const formData = new FormData();
    Object.entries(input).forEach(([key, value]) => {
        if (value == null) {
            return;
        }

        if (
            key === "file" &&
            typeof value === "object" &&
            value != null &&
            "buffer" in value
        ) {
            const uploadedFile = value as CreateBoardFileOptions["file"];
            const blob = new Blob([new Uint8Array(uploadedFile.buffer)], {
                type: uploadedFile.mimetype,
            });
            formData.append(key, blob, uploadedFile.originalname);
            return;
        }

        formData.append(key, `${value}`);
    });

    return formData;
};

const toBoardFile = (record: BoardFileRecord): BoardFile => ({
    boardId: record.boardId,
    createdAt: record.createdAt,
    displayName: record.displayName,
    emoji: isEmpty(record.emoji) ? null : record.emoji,
    id: record.id,
    position: record.position,
    size: record.size,
    updatedAt: record.updatedAt,
});

const BoardFilesStore = {
    bulkInsert,
    delete: _delete,
    get,
    insert,
    listByBoardSlug,
    listByToken,
    update,
};

export { BoardFilesStore };
