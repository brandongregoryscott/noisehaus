/**
 * Valid file MIME types
 */
const ACCEPTED_MIME_TYPES = [
    "audio/mpeg",
    "audio/mp4",
    "audio/wav",
    "audio/wave",
];

/**
 * Maximum upload size per file (1 MB)
 */
const MAX_FILE_SIZE_IN_BYTES = 1 * 1024 * 1024;

/**
 * Maximum number of files to upload at one time
 */
const MAX_FILE_COUNT_PER_UPLOAD = 10;

/**
 * Maximum total size of all files related to a board (10 MB)
 */
const MAXIMUM_BOARD_SIZE_IN_BYTES = 10 * 1024 * 1024;

export {
    ACCEPTED_MIME_TYPES,
    MAX_FILE_COUNT_PER_UPLOAD,
    MAX_FILE_SIZE_IN_BYTES,
    MAXIMUM_BOARD_SIZE_IN_BYTES,
};
