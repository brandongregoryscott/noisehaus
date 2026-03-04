import type { FileObject } from "@supabase/storage-js";
import { now } from "lodash-es";
import { extname } from "path";
import type {
    CreateObjectOptions,
    GetPresignedUrlsResult,
    PresignedFileObject,
    ReplaceObjectOptions,
} from "./types";
import { BucketName } from "../enums/bucket-name";
import { SupabaseClient } from "../supabase-client";
import { UnexpectedNullError } from "../utilities/errors";
import { getPath } from "../utilities/file-utilities";

/**
 * Default expiration time for presigned URLs (4 hours)
 */
const DEFAULT_PRESIGNED_URL_EXPIRY_IN_SECONDS = 60 * 60 * 4;

const unsafe__create = async (
    options: CreateObjectOptions
): Promise<FileObject> => {
    const { boardId, file } = options;
    const { buffer, originalname } = file;
    const timestamp = now();
    const filename = `${timestamp}${extname(originalname)}`;
    const path = getPath(boardId, filename);
    const { error } = await bucket().upload(path, buffer);

    if (error !== null) {
        throw error;
    }

    const fileObject = await unsafe__getByTimestamp(boardId, timestamp);

    if (fileObject === undefined) {
        throw new UnexpectedNullError("fileObject");
    }

    return fileObject;
};

const unsafe__delete = async (id: string, boardId: string): Promise<true> => {
    const fileObject = await unsafe__getByBoardIdAndId(boardId, id);
    if (fileObject === undefined) {
        return true;
    }

    const { error } = await bucket().remove([getPath(boardId, fileObject)]);
    if (error !== null) {
        throw error;
    }

    return true;
};

const unsafe__deleteAllByBoardId = async (boardId: string): Promise<true> => {
    const fileObjects = await unsafe__listByBoardId(boardId);

    const { error } = await bucket().remove(
        fileObjects.map((fileObject) => getPath(boardId, fileObject))
    );
    if (error !== null) {
        throw error;
    }

    return true;
};

const unsafe__getByTimestamp = async (
    boardId: string,
    timestamp: number
): Promise<FileObject | undefined> => {
    const files = await unsafe__listByBoardId(boardId);
    return files?.find((file) => file.name.startsWith(timestamp.toString()));
};

const unsafe__getByBoardIdAndId = async (
    boardId: string,
    id: string
): Promise<FileObject | undefined> => {
    const files = await unsafe__listByBoardId(boardId);
    return files.find((file) => file.id === id);
};

const unsafe__listByBoardId = async (
    boardId: string
): Promise<FileObject[]> => {
    const { data, error } = await bucket().list(boardId);
    if (error !== null) {
        throw error;
    }

    return data;
};

const unsafe__listByBoardIdWithPresignedUrl = async (
    boardId: string
): Promise<PresignedFileObject[]> => {
    const fileObjects = await unsafe__listByBoardId(boardId);
    const presignedUrls = await unsafe__getPresignedUrls(
        fileObjects.map((fileObject) => getPath(boardId, fileObject))
    );

    return fileObjects.map((fileObject) => {
        const path = getPath(boardId, fileObject);
        const signedUrl = presignedUrls[path];

        return { ...fileObject, signedUrl };
    });
};

const unsafe__replace = async (options: ReplaceObjectOptions) => {
    const { boardId, file, id } = options;
    const fileObject = await unsafe__getByBoardIdAndId(boardId, id);
    if (fileObject === undefined) {
        throw new UnexpectedNullError("fileObject");
    }

    const { buffer } = file;

    const originalPath = getPath(boardId, fileObject);
    const { error: updateError } = await bucket().update(originalPath, buffer);

    if (updateError !== null) {
        throw updateError;
    }

    return unsafe__getByBoardIdAndId(boardId, id);
};

const unsafe__getPresignedUrls = async (
    paths: string[]
): Promise<GetPresignedUrlsResult> => {
    const { data } = await bucket().createSignedUrls(
        paths,
        DEFAULT_PRESIGNED_URL_EXPIRY_IN_SECONDS
    );

    const result: Record<string, string> = {};
    data?.forEach(({ path, signedUrl }) => {
        if (path === null) {
            return;
        }

        result[path] = signedUrl;
    });

    return result;
};

const bucket = () => SupabaseClient.storage.from(BucketName.Samples);

const StorageStore = {
    bucket,
    unsafe__create,
    unsafe__delete,
    unsafe__deleteAllByBoardId,
    unsafe__listByBoardId,
    unsafe__listByBoardIdWithPresignedUrl,
    unsafe__replace,
};

export { StorageStore };
