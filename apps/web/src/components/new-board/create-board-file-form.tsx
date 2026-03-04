import type { Emoji } from "common";
import type { FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MAX_FILE_SIZE_IN_BYTES, getEmojiByColonCode } from "common";
import { isEmpty } from "lodash-es";
import { useState } from "react";
import { Box } from "@/components/box";
import { Button } from "@/components/button";
import { Column } from "@/components/column";
import { CoolButton } from "@/components/cool-button";
import { EmojiSelect } from "@/components/emoji-select";
import { Field } from "@/components/field";
import { FileUpload } from "@/components/file-upload";
import { Heading } from "@/components/heading";
import { Icon } from "@/components/icon";
import { Input } from "@/components/input";
import { MobileHeader } from "@/components/mobile-header";
import { Row } from "@/components/row";
import { Text } from "@/components/text";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useCreateContext } from "@/hooks/use-create-context";
import { Routes } from "@/routes";
import { formatSize } from "@/utils/number-utils";
import { validate } from "@/utils/validation";
import { nameValidator } from "@/utils/validators/board-file-validators";
import {
    nameValidator as boardNameValidator,
    slugValidator as boardSlugValidator,
} from "@/utils/validators/board-validators";

const CreateBoardFileForm: React.FC = () => {
    const navigate = useNavigate();
    const breakpoint = useBreakpoint();
    const {
        boardName,
        boardSlug,
        file,
        fileDisplayName,
        fileEmoji,
        setFile,
        setFileDisplayName,
        setFileEmoji,
    } = useCreateContext();
    const [nameErrorMessage, setNameErrorMessage] = useState<
        string | undefined
    >(undefined);
    const [fileErrorMessage, setFileErrorMessage] = useState<
        string | undefined
    >(undefined);
    const hasValidBoard =
        validate(boardNameValidator, boardName) === undefined &&
        validate(boardSlugValidator, boardSlug) === undefined;
    const hasPartialBoard =
        (!isEmpty(boardName) || !isEmpty(boardSlug)) && !hasValidBoard;

    const handleNameClear = () => {
        setFileDisplayName("");
    };

    const handleEmojiClear = () => handleEmojiChange(undefined);

    const handleEmojiChange = (emoji: Emoji | undefined) => {
        setFileEmoji(emoji?.colonCode);
    };

    const handleNameChange = async (event: FormEvent<HTMLInputElement>) => {
        const displayName = (event.target as HTMLInputElement).value;
        const validationState = validate(nameValidator, displayName);
        setNameErrorMessage(validationState?.firstError);
        setFileDisplayName(displayName);
    };

    const handleNameInput = async (event: FormEvent<HTMLInputElement>) => {
        const displayName = (event.target as HTMLInputElement).value;
        setFileDisplayName(displayName);
    };

    const handleFileChange = async (file: File | null | undefined) => {
        setFile(file ?? null);
        setFileErrorMessage(undefined);
    };

    const handleNext = () => {
        let hasError = false;
        if (file == null) {
            setFileErrorMessage("File is required");
            hasError = true;
        }

        const nameValidationState = validate(nameValidator, fileDisplayName);

        if (nameValidationState !== undefined) {
            hasError = true;
            setNameErrorMessage(nameValidationState?.firstError);
        }

        if (hasError) {
            return;
        }

        navigate({ to: Routes.CreateBoard });
    };

    return (
        <Column css={{ width: "100%" }}>
            {breakpoint === "mobile" && <MobileHeader />}
            <Row
                css={{
                    justifyContent:
                        breakpoint === "mobile" ? "center" : "flex-start",
                    marginTop: 32,
                    width: "100%",
                }}>
                <Heading size="h2">Upload a Sound</Heading>
            </Row>
            {breakpoint !== "mobile" && (
                <Row css={{ marginTop: 8 }}>
                    <Text as="code">
                        Sounds can be .mp3 or .wav files that are{" "}
                        {formatSize(MAX_FILE_SIZE_IN_BYTES)} or less in size.
                        After you've chosen a sound, you'll need to create a
                        board for it to live in.
                    </Text>
                </Row>
            )}
            <Box
                css={{
                    alignItems: "stretch",
                    display: "flex",
                    flexDirection: breakpoint === "mobile" ? "column" : "row",
                    gap: 16,
                    marginTop: 36,
                    width: "100%",
                }}>
                <Field fullWidth={true} label="Sound Name">
                    <Input
                        errorMessage={nameErrorMessage}
                        onChange={handleNameChange}
                        onClear={handleNameClear}
                        onInput={handleNameInput}
                        placeholder="Sound Name"
                        showClearAffordance={true}
                        value={fileDisplayName}
                        width="100%"
                    />
                </Field>
                <Field fullWidth={true} label="Related Emoji">
                    <EmojiSelect
                        onClear={handleEmojiClear}
                        onSelect={handleEmojiChange}
                        value={getEmojiByColonCode(fileEmoji ?? "")}
                    />
                </Field>
            </Box>
            <Row css={{ marginTop: 36, width: "100%" }}>
                <Field fullWidth={true}>
                    {breakpoint === "mobile" ? (
                        <>
                            <FileUpload
                                onChange={handleFileChange}
                                value={file ?? undefined}
                            />
                            {file != null && (
                                <CoolButton
                                    intent="primary"
                                    onClick={handleNext}
                                    width="100%">
                                    Continue
                                </CoolButton>
                            )}
                        </>
                    ) : (
                        <FileUpload
                            errorMessage={fileErrorMessage}
                            onChange={handleFileChange}
                            value={file ?? undefined}
                        />
                    )}
                </Field>
            </Row>
            {breakpoint === "desktop" && (
                <Row
                    css={{
                        justifyContent: "flex-end",
                        marginTop: 36,
                        width: "100%",
                    }}>
                    <Button onClick={handleNext}>
                        {hasPartialBoard
                            ? "Finish creating your board"
                            : "Create a board"}
                        <Icon name="ArrowRight" />
                    </Button>
                </Row>
            )}
        </Column>
    );
};

export { CreateBoardFileForm };
