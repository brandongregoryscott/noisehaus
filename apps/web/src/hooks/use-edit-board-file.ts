import type { ApiError, BoardFile, Emoji } from "common";
import type { FormEvent } from "react";
import { useState } from "react";
import { useUpdateBoardFile } from "@/hooks/use-update-board-file";
import { getFieldErrors, validate } from "@/utils/validation";
import { boardFileValidator } from "@/utils/validators/board-file-validators";

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
    const [errors, setErrors] = useState<{
        file?: string[];
        name?: string[];
    }>({});
    const [emoji, setEmoji] = useState(initialEmoji);
    const [file, setFile] = useState<File | null | undefined>(
        getFile(boardFile)
    );

    const { isPending, mutate: updateBoard } = useUpdateBoardFile({
        boardSlug,
        id,
        onError,
        onSuccess,
    });

    const handleNameChange = async (event: FormEvent<HTMLInputElement>) => {
        const updatedName = (event.target as HTMLInputElement).value;
        const validationState = validate(boardFileValidator, {
            file: file ?? null,
            name: updatedName,
        });
        const validationErrors = getFieldErrors(validationState);
        setErrors((currentErrors) => ({
            ...currentErrors,
            name: validationErrors.name,
        }));
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
        const validationState = validate(boardFileValidator, {
            file: file ?? null,
            name,
        });
        const validationErrors = getFieldErrors(validationState);
        setErrors(validationErrors);

        if (!validationState.success) {
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
        errors,
        file,
        handleEmojiClear,
        handleEmojiSelect,
        handleNameChange,
        handleNameClear,
        handleNameInput,
        handleSave,
        isPending,
        name,
        setFile,
    };
};

const getFile = (boardFile: BoardFile): File =>
    new File([], boardFile.display_name);

export { useEditBoardFile };
