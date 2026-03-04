import type { Emoji } from "common";
import type { FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LIST_BOARD_FILE_ROUTE } from "common";
import { useState } from "react";
import type { CreateBoardFileOptions } from "@/hooks/use-create-board-file";
import { Button } from "@/components/button";
import { CoolButton } from "@/components/cool-button";
import { EmojiSelect } from "@/components/emoji-select";
import { Field } from "@/components/field";
import { FileUpload } from "@/components/file-upload";
import { FullScreenSpinner } from "@/components/full-screen-spinner";
import { Heading } from "@/components/heading";
import { Input } from "@/components/input";
import {
    ResponsiveDialog,
    ResponsiveDialogBody,
    ResponsiveDialogFooter,
    ResponsiveDialogHeader,
} from "@/components/responsive-dialog";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useCreateBoardFile } from "@/hooks/use-create-board-file";
import { validate } from "@/utils/validation";
import { nameValidator } from "@/utils/validators/board-file-validators";

type CreateBoardFileDialogProps = {
    boardSlug: string;
    isOpen: boolean;
    onClose: () => void;
    token: string;
};

const CreateBoardFileDialog: React.FC<CreateBoardFileDialogProps> = (props) => {
    const { boardSlug, isOpen, onClose, token } = props;
    const breakpoint = useBreakpoint();
    const client = useQueryClient();
    const handleSuccess = () => {
        client.invalidateQueries({
            queryKey: [LIST_BOARD_FILE_ROUTE, boardSlug, token],
        });

        onClose();
    };

    const { isLoading, mutate: createBoardFile } = useCreateBoardFile({
        boardSlug,
        onSuccess: handleSuccess,
        token,
    });

    const [name, setName] = useState<string>("");
    const [nameErrorMessage, setNameErrorMessage] = useState<
        string | undefined
    >(undefined);
    const [emoji, setEmoji] = useState<Emoji | undefined>(undefined);
    const [file, setFile] = useState<File | null | undefined>(undefined);
    const [fileErrorMessage, setFileErrorMessage] = useState<
        string | undefined
    >(undefined);
    const handleNameChange = async (event: FormEvent<HTMLInputElement>) => {
        const name = (event.target as HTMLInputElement).value;
        const validationState = validate(nameValidator, name);

        setNameErrorMessage(validationState?.firstError);
        setName(name);
    };

    const handleNameClear = () => {
        setName("");
    };

    const handleEmojiClear = () => {
        setEmoji(undefined);
    };

    const handleSave = () => {
        let hasError = false;
        if (file == null) {
            setFileErrorMessage("File is required");
            hasError = true;
        }

        const nameValidationState = validate(nameValidator, name);

        if (nameValidationState !== undefined) {
            hasError = true;
            setNameErrorMessage(nameValidationState.firstError);
        }

        if (hasError) {
            return;
        }

        const files: CreateBoardFileOptions[] = [
            { displayName: name, emoji: emoji?.unicode, file: file! },
        ];
        createBoardFile(files);
    };

    if (isLoading && breakpoint === "mobile") {
        return <FullScreenSpinner message="Creating Sound" />;
    }

    return (
        <ResponsiveDialog isOpen={isOpen} onClose={onClose}>
            <ResponsiveDialogHeader>
                <Heading size="h3">Add Sound</Heading>
            </ResponsiveDialogHeader>
            <ResponsiveDialogBody css={{ rowGap: 24 }}>
                <Field fullWidth={true} label="Sound Name">
                    <Input
                        errorMessage={nameErrorMessage}
                        onChange={handleNameChange}
                        onClear={handleNameClear}
                        placeholder="Sound Name"
                        showClearAffordance={true}
                        value={name}
                        width="100%"
                    />
                </Field>
                <Field fullWidth={true} label="Related Emoji">
                    <EmojiSelect
                        onClear={handleEmojiClear}
                        onSelect={setEmoji}
                        value={emoji}
                    />
                </Field>
                <Field fullWidth={true}>
                    <FileUpload
                        errorMessage={fileErrorMessage}
                        onChange={setFile}
                        value={file ?? undefined}
                    />
                </Field>
            </ResponsiveDialogBody>
            <ResponsiveDialogFooter>
                {breakpoint === "desktop" && (
                    <>
                        <Button
                            disabled={isLoading}
                            fillStyle="Ghost"
                            onClick={onClose}>
                            Cancel
                        </Button>
                        <Button isLoading={isLoading} onClick={handleSave}>
                            Save
                        </Button>
                    </>
                )}
                {breakpoint === "mobile" && file != null && (
                    <CoolButton
                        intent="primary"
                        leftIcon="Checkmark"
                        onClick={handleSave}
                        width="100%">
                        Create Sound
                    </CoolButton>
                )}
            </ResponsiveDialogFooter>
        </ResponsiveDialog>
    );
};

export { CreateBoardFileDialog };
