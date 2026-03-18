import type { BoardFile } from "common";
import { useQueryClient } from "@tanstack/react-query";
import { LIST_BOARD_FILE_ROUTE, getEmojiByColonCode } from "common";
import { first } from "lodash-es";
import { Box } from "@/components/box";
import { Button } from "@/components/button";
import { EmojiSelect } from "@/components/emoji-select";
import { Field } from "@/components/field";
import { FileUpload } from "@/components/file-upload";
import { Heading } from "@/components/heading";
import { Input } from "@/components/input";
import {
    ResponsiveDialog,
    ResponsiveDialogBody,
    ResponsiveDialogFooter,
    ResponsiveDialogHeader,
} from "@/components/responsive-dialog";
import { useEditBoardFile } from "@/hooks/use-edit-board-file";

type EditBoardFileDialogProps = {
    boardFile: BoardFile;
    isOpen: boolean;
    onClose: () => void;
    token: string;
};

const EditBoardFileDialog: React.FC<EditBoardFileDialogProps> = (props) => {
    const { boardFile, isOpen, onClose, token } = props;
    const { board_slug: boardSlug } = boardFile;
    const client = useQueryClient();
    const handleSuccess = () => {
        client.invalidateQueries({
            queryKey: [LIST_BOARD_FILE_ROUTE, boardSlug, token],
        });

        onClose();
    };

    const {
        emoji,
        file,
        errors,
        handleEmojiClear,
        handleEmojiSelect,
        handleNameChange,
        handleNameClear,
        handleNameInput,
        handleSave,
        isPending,
        name,
        setFile,
    } = useEditBoardFile({ boardFile, onSuccess: handleSuccess, token });

    return (
        <ResponsiveDialog isOpen={isOpen} onClose={onClose}>
            <ResponsiveDialogHeader>
                <Heading size="h3">Edit Sound</Heading>
            </ResponsiveDialogHeader>
            <ResponsiveDialogBody>
                <Box
                    css={{
                        display: "flex",
                        flexDirection: "column",
                        rowGap: 24,
                    }}>
                    <Field fullWidth={true} label="Sound Name">
                        <Input
                            errorMessage={first(errors.name)}
                            onChange={handleNameChange}
                            onClear={handleNameClear}
                            onInput={handleNameInput}
                            placeholder="Sound Name"
                            showClearAffordance={true}
                            value={name}
                            width="100%"
                        />
                    </Field>
                    <Field fullWidth={true} label="Related Emoji">
                        <EmojiSelect
                            onClear={handleEmojiClear}
                            onSelect={handleEmojiSelect}
                            value={getEmojiByColonCode(emoji ?? "")}
                        />
                    </Field>
                    <Field fullWidth={true}>
                        <FileUpload
                            errorMessage={first(errors.file)}
                            onChange={setFile}
                            value={file ?? undefined}
                        />
                    </Field>
                </Box>
            </ResponsiveDialogBody>
            <ResponsiveDialogFooter>
                <Button fillStyle="Ghost" onClick={onClose}>
                    Cancel
                </Button>
                <Button isLoading={isPending} onClick={handleSave}>
                    Save
                </Button>
            </ResponsiveDialogFooter>
        </ResponsiveDialog>
    );
};

export { EditBoardFileDialog };
