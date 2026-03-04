import type { FileObject } from "@supabase/storage-js";
import { isString } from "lodash-es";

const formatFileSize = (sizeInBytes: number): string => {
    if (sizeInBytes < 1024) {
        return `${sizeInBytes} bytes`;
    }

    const sizeInMb = sizeInBytes / 1024 / 1024;

    return `${sizeInMb.toFixed(1)} MB`;
};

const getPath = (boardId: string, fileOrName: FileObject | string): string => {
    if (isString(fileOrName)) {
        return `${boardId}/${fileOrName}`;
    }

    return `${boardId}/${fileOrName.name}`;
};

export { formatFileSize, getPath };
