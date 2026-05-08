import type { BoardFile, PresignedBoardFile } from "common";
import { MAXIMUM_BOARD_SIZE_IN_BYTES } from "common";
import { isEmpty, sumBy } from "lodash-es";
import type {
    BulkCreateBoardFileOptions,
    CreateBoardFileOptions,
    ListBoardFilesByTokenOptions,
    UpdateBoardFileOptions,
    UnsafeCreateOptions,
} from "@/board-files/types";
import { BoardsStore } from "@/boards/store";
import { PocketBaseClient } from "@/pocketbase-client";
import {
    NotFoundError,
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

const bulkInsert = async (
    options: BulkCreateBoardFileOptions
): Promise<BoardFile[]> => {
    const { boardSlug, displayNames, emojis, files, token } = options;
    const board = await BoardsStore.getByToken({ slug: boardSlug, token });

    await BoardFilesStore.unsafe__verifyRemainingSize(
        board.id,
        sumBy(files, (file) => file.size)
    );

    return Promise.all(
        files.map((file, index) =>
            unsafe__create({
                boardId: board.id,
                boardSlug,
                displayName: displayNames[index],
                emoji: emojis[index],
                file,
            })
        )
    );
};

const _delete = async (
    id: string,
    boardSlug: string,
    token: string
): Promise<true> => {
    const board = await BoardsStore.getByToken({ slug: boardSlug, token });
    await unsafe__delete(id, board.id);
    return true;
};

const deleteAll = async (boardSlug: string, token: string): Promise<true> => {
    const board = await BoardsStore.getByToken({ slug: boardSlug, token });
    return unsafe__deleteAllByBoardId(board.id);
};

const insert = async (options: CreateBoardFileOptions): Promise<BoardFile> => {
    const { boardSlug, displayName, emoji, file, token } = options;
    const board = await BoardsStore.getByToken({ slug: boardSlug, token });

    await BoardFilesStore.unsafe__verifyRemainingSize(board.id, file.size);

    return unsafe__create({
        boardId: board.id,
        boardSlug,
        displayName,
        emoji,
        file,
    });
};

const getByIdBoardSlugAndToken = async (
    id: string,
    boardSlug: string,
    token: string
): Promise<BoardFile> => {
    const [boardFile] = await Promise.all([
        getById(id),
        BoardsStore.authorizeWritePermissionOrThrow({ slug: boardSlug, token }),
    ]);

    return boardFile;
};

const getById = async (id: string): Promise<BoardFile> => {
    const boardFile = await unsafe__getById(id);
    if (boardFile === null) {
        throw new NotFoundError("No file with this id was found");
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
    const boardFile = await getByIdBoardSlugAndToken(id, boardSlug, token);

    let updatedBoardFile: Record<string, unknown> = {};
    if (!isEmpty(displayName)) {
        updatedBoardFile = { ...updatedBoardFile, displayName: displayName! };
    }

    if (!isEmpty(emoji)) {
        updatedBoardFile = {
            ...updatedBoardFile,
            emoji: emoji === "null" ? "" : emoji!,
        };
    }

    if (file !== undefined) {
        const additionalSizeInBytes = Math.max(file.size - boardFile.size, 0);
        await BoardFilesStore.unsafe__verifyRemainingSize(
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

const unsafe__create = async (
    options: UnsafeCreateOptions
): Promise<BoardFile> => {
    const { boardId, displayName, emoji, file } = options;
    const record = await PocketBaseClient.createRecord<BoardFileRecord>(
        BOARD_FILE_COLLECTION,
        toFormData({
            boardId,
            displayName,
            emoji: emoji != null && emoji !== "null" ? emoji : "",
            file,
            size: file.size,
        })
    );

    return toBoardFile(record);
};

const unsafe__delete = async (id: string, _boardId: string): Promise<true> => {
    await PocketBaseClient.deleteRecord(BOARD_FILE_COLLECTION, id);
    return true;
};

const unsafe__deleteAllByBoardId = async (boardId: string): Promise<true> => {
    const records = await unsafe__listRecordsByBoardId(boardId);
    await Promise.all(
        records.map((record) =>
            PocketBaseClient.deleteRecord(BOARD_FILE_COLLECTION, record.id)
        )
    );
    return true;
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
            const uploadedFile = value as UnsafeCreateOptions["file"];
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
    position: record.position || null,
    size: record.size,
    updatedAt: record.updatedAt,
});

const BoardFilesStore = {
    bulkInsert,
    delete: _delete,
    deleteAll,
    getById,
    insert,
    listByBoardSlug,
    listByToken,
    unsafe__deleteAllByBoardId,
    unsafe__getById,
    unsafe__verifyRemainingSize,
    update,
};

export { BoardFilesStore };
