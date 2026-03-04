import { capitalize } from "lodash-es";
import type { Emoji } from "../constants/emojis";
import { EMOJI_LIST } from "../constants/emojis";

/**
 * Converts a colon code emoji string to its unicode equivalent (emoji form), i.e. :heart: -> ❤️
 */
const colonCodeToUnicode = (colonCode: string): string | undefined =>
    EMOJI_LIST.find((emoji) => emoji.colonCode === colonCode)?.unicode;

/**
 * Converts a unicode emoji character to its colon code equivalent i.e. ❤️ -> :heart:
 */
const unicodeToColonCode = (unicode: string): string | undefined =>
    EMOJI_LIST.find((emoji) => emoji.unicode === unicode)?.colonCode;

/**
 * Returns an emoji object to a legible label format, i.e. ❤️ Heart
 */
const getEmojiLabel = (emoji: Emoji | undefined): string | undefined =>
    emoji === undefined
        ? undefined
        : `${emoji.unicode} ${emoji.colonCode
              .replace(/\:/g, "")
              .split("_")
              .map(capitalize)
              .join(" ")}`;

const getEmojiByColonCode = (colonCode: string): Emoji | undefined =>
    EMOJI_LIST.find((emoji) => emoji.colonCode === colonCode);

export {
    colonCodeToUnicode,
    getEmojiByColonCode,
    getEmojiLabel,
    unicodeToColonCode,
};
