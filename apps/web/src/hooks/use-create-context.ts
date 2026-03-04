import { useContext } from "react";
import {
    CreateContext,
    DEFAULT_CREATE_CONTEXT_VALUE,
} from "@/contexts/create-context";

type UseCreateContextResult = {
    resetState: () => void;
    setBoardName: (name: string) => void;
    setBoardSlug: (slug: string) => void;
    setFile: (file: File | null) => void;
    setFileDisplayName: (fileDisplayName: string) => void;
    setFileEmoji: (fileEmoji: string | undefined) => void;
} & Omit<CreateContext, "setValue">;

const useCreateContext = (): UseCreateContextResult => {
    const { boardName, boardSlug, file, fileDisplayName, fileEmoji, setValue } =
        useContext(CreateContext);

    const setBoardName = (boardName: string) =>
        setValue((prev) => ({ ...prev, boardName }));

    const setBoardSlug = (boardSlug: string) =>
        setValue((prev) => ({ ...prev, boardSlug }));

    const setFile = (file: File | null) =>
        setValue((prev) => ({ ...prev, file }));

    const setFileDisplayName = (fileDisplayName: string) =>
        setValue((prev) => ({ ...prev, fileDisplayName }));

    const setFileEmoji = (fileEmoji: string | undefined) =>
        setValue((prev) => ({ ...prev, fileEmoji }));

    const resetState = () => {
        setValue(DEFAULT_CREATE_CONTEXT_VALUE);
    };

    return {
        boardName,
        boardSlug,
        file,
        fileDisplayName,
        fileEmoji,
        resetState,
        setBoardName,
        setBoardSlug,
        setFile,
        setFileDisplayName,
        setFileEmoji,
    };
};

export type { UseCreateContextResult };
export { useCreateContext };
