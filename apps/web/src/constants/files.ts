import { MAX_FILE_SIZE_IN_BYTES } from "common";
import { formatSize } from "@/utils/number-utils";

const FILE_UPLOAD_PLACEHOLDER = `Sounds can be .mp3 or .wav files that are ${formatSize(
    MAX_FILE_SIZE_IN_BYTES
)} or less in size.`;

export { FILE_UPLOAD_PLACEHOLDER };
