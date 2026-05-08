import { isString } from "lodash-es";
import type { FileObject } from "@/storage/types";

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
