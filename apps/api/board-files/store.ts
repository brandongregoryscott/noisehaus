import type { BoardFile, PresignedBoardFile } from "common";
import { MAXIMUM_BOARD_SIZE_IN_BYTES } from "common";
import { isEmpty, keyBy, sumBy } from "lodash-es";
import type {
    BulkCreateBoardFileOptions,
    CreateBoardFileOptions,
    GetBoardFileSizeResult,
    ListBoardFilesByTokenOptions,
    UpdateBoardFileOptions,
    UnsafeCreateOptions,
} from "./types";
import { BoardsStore } from "../boards/store";
import { StorageStore } from "../storage/store";
import { SupabaseClient } from "../supabase-client";
import { NotFoundError, ValidationError } from "../utilities/errors";
import { formatFileSize } from "../utilities/file-utilities";

const bulkInsert = async (
    options: BulkCreateBoardFileOptions
): Promise<BoardFile[]> => {
    const { boardSlug, displayNames, emojis, files, token } = options;
    const board = await BoardsStore.getByToken({
        slug: boardSlug,
        token,
    });
    const { id: boardId } = board;

    await BoardFilesStore.unsafe__verifyRemainingSize(
        boardId,
        sumBy(files, (file) => file.size)
    );
    const fileResults = await Promise.all(
        files.map(async (file, index) => {
            const fileObject = await StorageStore.unsafe__create({
                boardId,
                file,
            });
            return { file, fileObject, index };
        })
    );
    const boardFiles = await Promise.all(
        fileResults.map((fileResult) => {
            const { file, fileObject, index } = fileResult;
            const displayName = displayNames[index];
            const emoji = emojis[index];
            return unsafe__create({
                boardId,
                boardSlug,
                displayName,
                emoji,
                file,
                fileObject,
            });
        })
    );

    return boardFiles;
};

const _delete = async (
    id: string,
    boardSlug: string,
    token: string
): Promise<true> => {
    const board = await BoardsStore.getByToken({
        slug: boardSlug,
        token,
    });
    await unsafe__delete(id, board.id);
    return true;
};

const deleteAll = async (boardSlug: string, token: string): Promise<true> => {
    const board = await BoardsStore.getByToken({
        slug: boardSlug,
        token,
    });
    return unsafe__deleteAllByBoardId(board.id);
};

const insert = async (options: CreateBoardFileOptions): Promise<BoardFile> => {
    const { boardSlug, displayName, emoji, file, token } = options;
    const board = await BoardsStore.getByToken({
        slug: boardSlug,
        token,
    });
    const { id: boardId } = board;

    await BoardFilesStore.unsafe__verifyRemainingSize(boardId, file.size);

    const fileObject = await StorageStore.unsafe__create({ boardId, file });
    const boardFile = await unsafe__create({
        boardId,
        boardSlug,
        displayName,
        emoji,
        file,
        fileObject,
    });

    return boardFile;
};

const getByIdBoardSlugAndToken = async (
    id: string,
    boardSlug: string,
    token: string
): Promise<BoardFile> => {
    const [boardFile] = await Promise.all([
        unsafe__getById(id),
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

const getSizeByBoardSlugAndToken = async (
    boardSlug: string,
    token: string
): Promise<GetBoardFileSizeResult> => {
    const board = await BoardsStore.getByToken({ slug: boardSlug, token });
    return unsafe__getSizeByBoardId(board.id);
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
    const boardFiles = await unsafe__listByBoardId(boardId);
    const fileObjects =
        await StorageStore.unsafe__listByBoardIdWithPresignedUrl(boardId);
    const fileObjectsMap = keyBy(fileObjects, "id");

    return boardFiles.map((boardFile) => {
        const signedUrl = fileObjectsMap[boardFile.id].signedUrl;
        return { ...boardFile, signedUrl };
    });
};

const update = async (options: UpdateBoardFileOptions): Promise<BoardFile> => {
    const { boardSlug, displayName, emoji, file, id, token } = options;
    const boardFile = await getByIdBoardSlugAndToken(id, boardSlug, token);

    let updatedBoardFile = {};
    if (!isEmpty(displayName)) {
        updatedBoardFile = { ...updatedBoardFile, display_name: displayName! };
    }

    if (!isEmpty(emoji)) {
        updatedBoardFile = {
            ...updatedBoardFile,
            emoji: emoji === "null" ? null : emoji!,
        };
    }

    if (file !== undefined) {
        const additionalSizeInBytes = Math.max(file.size - boardFile.size, 0);
        await BoardFilesStore.unsafe__verifyRemainingSize(
            boardFile.board_id,
            additionalSizeInBytes
        );

        updatedBoardFile = { ...updatedBoardFile, size: file.size };
        const [{ data }] = await Promise.all([
            table()
                .update(updatedBoardFile)
                .eq("id", id)
                .throwOnError()
                .select("*")
                .single(),
            StorageStore.unsafe__replace({
                boardId: boardFile.board_id,
                file,
                id,
            }),
        ]);
        return data!;
    }

    const { data } = await table()
        .update(updatedBoardFile)
        .eq("id", id)
        .throwOnError()
        .select("*")
        .single();

    return data!;
};

const unsafe__create = async (
    options: UnsafeCreateOptions
): Promise<BoardFile> => {
    const { boardId, boardSlug, displayName, emoji, file, fileObject } =
        options;
    const { data } = await table()
        .insert({
            board_id: boardId,
            board_slug: boardSlug,
            display_name: displayName,
            // The frontend should send through a literal "null" string if no emoji was selected
            emoji: emoji != null && emoji !== "null" ? emoji : undefined,
            id: fileObject.id,
            size: file.size,
        })
        .throwOnError()
        .select("*")
        .single();

    return data!;
};

const unsafe__delete = async (id: string, boardId: string): Promise<true> => {
    await StorageStore.unsafe__delete(id, boardId);
    return true;
};

const unsafe__deleteAllByBoardId = async (boardId: string): Promise<true> => {
    await StorageStore.unsafe__deleteAllByBoardId(boardId);
    return true;
};

const unsafe__getById = async (id: string): Promise<BoardFile> => {
    const { data } = await table()
        .select("*")
        .eq("id", id)
        .throwOnError()
        .maybeSingle();
    return data!;
};

const unsafe__getSizeByBoardId = async (
    boardId: string
): Promise<GetBoardFileSizeResult> => {
    const boardFiles = await unsafe__listByBoardId(boardId);
    const { length: count } = boardFiles;
    const sizeInBytes = sumBy(boardFiles, (boardFile) => boardFile.size);
    return {
        count,
        remainingSizeInBytes: Math.max(
            MAXIMUM_BOARD_SIZE_IN_BYTES - sizeInBytes,
            0
        ),
        sizeInBytes,
    };
};

const unsafe__listByBoardId = async (boardId: string): Promise<BoardFile[]> => {
    const { data } = await table()
        .select("*")
        .throwOnError()
        .eq("board_id", boardId);

    return data ?? [];
};

const unsafe__verifyRemainingSize = async (
    boardId: string,
    incomingSizeInBytes: number
): Promise<void> => {
    const { remainingSizeInBytes } = await unsafe__getSizeByBoardId(boardId);
    if (remainingSizeInBytes < incomingSizeInBytes) {
        throw new ValidationError(
            `The file(s) provided exceed the remaining size capacity for the board (${formatFileSize(
                remainingSizeInBytes
            )})`
        );
    }
};

const table = () => SupabaseClient.from("board_file");

const BoardFilesStore = {
    bulkInsert,
    delete: _delete,
    deleteAll,
    getById,
    getSizeByBoardSlugAndToken,
    insert,
    listByBoardSlug,
    listByToken,
    table,
    unsafe__getById,
    unsafe__getSizeByBoardId,
    unsafe__verifyRemainingSize,
    update,
};

export { BoardFilesStore };
