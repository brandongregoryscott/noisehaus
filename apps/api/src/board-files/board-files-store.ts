import type { BoardFile, PresignedBoardFile } from "common";
import { isEmpty } from "lodash-es";
import { PocketBaseClient } from "@/pocketbase-client";
import { withPocketBaseErrors } from "@/storage/pocketbase-errors";
import { UnexpectedNullError } from "@/utilities/errors";

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
    files: InsertBoardFileOptions[]
): Promise<BoardFile[]> => {
    const records = await PocketBaseClient.createRecords<BoardFileRecord[]>(
        files.map((file) => ({
            collection: BOARD_FILE_COLLECTION,
            data: toFormData(file),
        }))
    );
    return records.map(toBoardFile);
};

const _delete = async (id: string): Promise<void> => {
    await PocketBaseClient.deleteRecord(BOARD_FILE_COLLECTION, id);
};

const update = async (
    id: string,
    input: UpdateStoredBoardFileOptions
): Promise<BoardFile> => {
    const data = input.file === undefined ? input : toFormData(input);
    const record = await PocketBaseClient.updateRecord<BoardFileRecord>(
        BOARD_FILE_COLLECTION,
        id,
        data
    );
    return toBoardFile(record);
};

const listWithPresignedUrls = async (
    boardId: string
): Promise<PresignedBoardFile[]> => {
    const boardFiles = await listRecordsByBoardId(boardId);
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

const findById = async (id: string): Promise<BoardFile | null> => {
    const record =
        await PocketBaseClient.getFirstRecordByFilter<BoardFileRecord>(
            BOARD_FILE_COLLECTION,
            `id = ${PocketBaseClient.escapeFilterValue(id)}`
        );

    return record == null ? null : toBoardFile(record);
};

const listByBoardId = async (boardId: string): Promise<BoardFile[]> => {
    const records = await listRecordsByBoardId(boardId);
    return records.map(toBoardFile);
};

const listRecordsByBoardId = async (
    boardId: string
): Promise<BoardFileRecord[]> =>
    PocketBaseClient.listRecords<BoardFileRecord>(BOARD_FILE_COLLECTION, {
        filter: `boardId = ${PocketBaseClient.escapeFilterValue(boardId)}`,
        sort: "position,createdAt",
    });

const toFormData = (
    input: { boardId?: string } & UpdateStoredBoardFileOptions
): FormData => {
    const { file, ...fields } = input;
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
        if (value != null) {
            formData.append(key, `${value}`);
        }
    });
    if (file == null) {
        return formData;
    }

    const blob = new Blob([new Uint8Array(file.buffer)], {
        type: file.mimetype,
    });
    formData.append("file", blob, file.originalname);
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
    bulkInsert: withPocketBaseErrors(bulkInsert),
    delete: withPocketBaseErrors(_delete),
    findById: withPocketBaseErrors(findById),
    listByBoardId: withPocketBaseErrors(listByBoardId),
    listWithPresignedUrls: withPocketBaseErrors(listWithPresignedUrls),
    update: withPocketBaseErrors(update),
};

export type {
    InsertBoardFileOptions,
    UpdateStoredBoardFileOptions,
    UploadedBoardFile,
};
export { BoardFilesStore };
