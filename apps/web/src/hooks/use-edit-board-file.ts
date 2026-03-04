import type { ApiError, BoardFile, Emoji } from "common";
import type { FormEvent } from "react";
import { useState } from "react";
import { useUpdateBoardFile } from "@/hooks/use-update-board-file";
import { validate } from "@/utils/validation";
import { nameValidator } from "@/utils/validators/board-validators";

type UseEditBoardFileOptions = {
    boardFile: BoardFile;
    onError?: (error: ApiError) => void;
    onSuccess?: (updatedBoardFile: BoardFile) => void;
    token: string;
};

const useEditBoardFile = (options: UseEditBoardFileOptions) => {
    const { boardFile, onError, onSuccess, token } = options;
    const {
        board_slug: boardSlug,
        display_name: initialName,
        emoji: initialEmoji,
        id,
    } = boardFile;
    const [name, setName] = useState(initialName);
    const [nameErrorMessage, setNameErrorMessage] = useState<
        string | undefined
    >(undefined);
    const [emoji, setEmoji] = useState(initialEmoji);
    const [fileErrorMessage, setFileErrorMessage] = useState<
        string | undefined
    >(undefined);
    const [file, setFile] = useState<File | null | undefined>(
        getFile(boardFile)
    );

    const { isLoading, mutate: updateBoard } = useUpdateBoardFile({
        boardSlug,
        id,
        onError,
        onSuccess,
    });

    const handleNameChange = async (event: FormEvent<HTMLInputElement>) => {
        const updatedName = (event.target as HTMLInputElement).value;
        const validationState = validate(nameValidator, updatedName);
        setNameErrorMessage(validationState?.firstError);
        setName(updatedName);
    };

    const handleNameInput = async (event: FormEvent<HTMLInputElement>) => {
        const updatedName = (event.target as HTMLInputElement).value;

        setName(updatedName);
    };

    const handleNameClear = () => {
        setName("");
    };

    const handleEmojiClear = () => {
        setEmoji(null);
    };

    const handleEmojiSelect = (emoji: Emoji | undefined) => {
        setEmoji(emoji?.colonCode ?? null);
    };

    const handleSave = async () => {
        let hasError = false;
        const validationState = validate(nameValidator, name);
        setNameErrorMessage(validationState?.firstError);
        if (validationState !== undefined) {
            hasError = true;
        }

        if (file == null) {
            setFileErrorMessage("File is required");
            hasError = true;
        }

        if (hasError) {
            return;
        }

        updateBoard({
            displayName: name,
            emoji: emoji ?? null,
            file: file!,
            token,
        });
    };

    return {
        emoji,
        file,
        fileErrorMessage,
        handleEmojiClear,
        handleEmojiSelect,
        handleNameChange,
        handleNameClear,
        handleNameInput,
        handleSave,
        isLoading,
        name,
        nameErrorMessage,
        setFile,
    };
};

const getFile = (boardFile: BoardFile): File =>
    new File([], boardFile.display_name);

export { useEditBoardFile };
