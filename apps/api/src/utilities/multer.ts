import { ACCEPTED_MIME_TYPES, MAX_FILE_SIZE_IN_BYTES } from "common";
import Multer, { memoryStorage } from "multer";
import { ValidationError } from "@/utilities/errors";

const multer = Multer({
    fileFilter: (_req, file, callback) => {
        const isValidMimeType = ACCEPTED_MIME_TYPES.includes(file.mimetype);
        if (isValidMimeType) {
            callback(null, true);
            return;
        }

        const mimeTypes = ACCEPTED_MIME_TYPES.map(
            (mimeType) => `'${mimeType}'`
        ).join(", ");

        callback(
            new ValidationError(
                `File must be one of the following types: ${mimeTypes}`
            )
        );
    },
    limits: {
        fileSize: MAX_FILE_SIZE_IN_BYTES,
    },
    storage: memoryStorage(),
});

export { multer };
