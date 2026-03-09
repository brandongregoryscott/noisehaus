import type { FileObject } from "@supabase/storage-js";
import type { Readable } from "stream";

type CreateObjectOptions = {
    boardId: string;
    file: MulterFile;
};

type ReplaceObjectOptions = {
    boardId: string;
    file: MulterFile;
    id: string;
};

/**
 * Vendorized version of the File interface defined by Multer, which isn't exported
 */
type MulterFile = {
    /** `MemoryStorage` only: A Buffer containing the entire file. */
    buffer: Buffer;
    /** `DiskStorage` only: Directory to which this file has been uploaded. */
    destination: string;
    /**
     * Value of the `Content-Transfer-Encoding` header for this file.
     * @deprecated since July 2015
     * @see RFC 7578, Section 4.7
     */
    encoding: string;
    /** Name of the form field associated with this file. */
    fieldname: string;
    /** `DiskStorage` only: Name of this file within `destination`. */
    filename: string;
    /** Value of the `Content-Type` header for this file. */
    mimetype: string;
    /** Name of the file on the uploader's computer. */
    originalname: string;
    /** `DiskStorage` only: Full path to the uploaded file. */
    path: string;
    /** Size of the file in bytes. */
    size: number;
    /**
     * A readable stream of this file. Only available to the `_handleFile`
     * callback for custom `StorageEngine`s.
     */
    stream: Readable;
};

type PresignedFileObject = {
    signedUrl: string;
} & FileObject;

type GetPresignedUrlsResult = {
    [path: string]: string;
};

export type {
    CreateObjectOptions,
    GetPresignedUrlsResult,
    MulterFile,
    PresignedFileObject,
    ReplaceObjectOptions,
};
