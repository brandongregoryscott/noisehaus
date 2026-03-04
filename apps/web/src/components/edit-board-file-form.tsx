import type { BoardFile } from "common";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import {
    getEmojiByColonCode,
    LIST_BOARD_FILE_ROUTE,
    GET_BOARD_FILE_ROUTE,
} from "common";
import { Button } from "@/components/button";
import { Column } from "@/components/column";
import { CoolButton } from "@/components/cool-button";
import { EmojiSelect } from "@/components/emoji-select";
import { Field } from "@/components/field";
import { FileUpload } from "@/components/file-upload";
import { FullScreenSpinner } from "@/components/full-screen-spinner";
import { Heading } from "@/components/heading";
import { Icon } from "@/components/icon";
import { Input } from "@/components/input";
import { MobileHeader } from "@/components/mobile-header";
import { Row } from "@/components/row";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useEditBoardFile } from "@/hooks/use-edit-board-file";

type EditBoardFileFormProps = {
    boardFile: BoardFile;
    token: string;
};

const EditBoardFileForm: React.FC<EditBoardFileFormProps> = (props) => {
    const { boardFile, token } = props;
    const breakpoint = useBreakpoint();
    const router = useRouter();
    const client = useQueryClient();
    const handleSuccess = () => {
        client.invalidateQueries({
            queryKey: [LIST_BOARD_FILE_ROUTE, boardFile.board_slug, token],
        });
        client.invalidateQueries({
            queryKey: [
                GET_BOARD_FILE_ROUTE,
                boardFile.board_slug,
                boardFile.id,
            ],
        });
        router.history.back();
    };
    const {
        emoji,
        file,
        handleEmojiClear,
        handleEmojiSelect,
        handleNameChange,
        handleNameClear,
        handleSave,
        isLoading,
        name,
        nameErrorMessage,
        setFile,
    } = useEditBoardFile({ boardFile, onSuccess: handleSuccess, token });

    const handleBack = () => {
        router.history.back();
    };

    if (isLoading) {
        return <FullScreenSpinner message="Saving Sound" />;
    }

    return (
        <Column css={{ justifyContent: "stretch", width: "100%" }}>
            {breakpoint === "mobile" && (
                <MobileHeader
                    leftContent={
                        <Button
                            fillStyle="Ghost"
                            onClick={handleBack}
                            size="Small">
                            <Icon name="ChevronLeft" />
                            Back
                        </Button>
                    }
                />
            )}
            <Column css={{ gap: 16, marginTop: 16, width: "100%" }}>
                <Row
                    css={{
                        justifyContent: "center",
                        marginTop: 36,
                        width: "100%",
                    }}>
                    <Heading size="h1">Edit Sound</Heading>
                </Row>
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
                        onSelect={handleEmojiSelect}
                        value={getEmojiByColonCode(emoji ?? "")}
                    />
                </Field>
                <Field fullWidth={true}>
                    <FileUpload onChange={setFile} value={file ?? undefined} />
                </Field>
                {file != null && (
                    <Row css={{ marginTop: 36, width: "100%" }}>
                        <CoolButton
                            intent="primary"
                            leftIcon="Checkmark"
                            onClick={handleSave}
                            width="100%">
                            Save
                        </CoolButton>
                    </Row>
                )}
            </Column>
        </Column>
    );
};

export { EditBoardFileForm };
