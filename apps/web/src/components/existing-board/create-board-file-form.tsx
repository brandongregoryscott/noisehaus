import type { Emoji } from "common";
import type { FormEvent } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { MAX_FILE_SIZE_IN_BYTES, getEmojiByColonCode } from "common";
import { useState } from "react";
import type { CreateBoardFileOptions } from "@/hooks/use-create-board-file";
import { Box } from "@/components/box";
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
import { Text } from "@/components/text";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useCreateBoardFile } from "@/hooks/use-create-board-file";
import { Routes } from "@/routes";
import { formatSize } from "@/utils/number-utils";
import { validate } from "@/utils/validation";
import { nameValidator } from "@/utils/validators/board-file-validators";

type CreateBoardFileFormProps = {
    boardSlug: string;
    token: string;
};

const CreateBoardFileForm: React.FC<CreateBoardFileFormProps> = (props) => {
    const { boardSlug, token } = props;
    const router = useRouter();
    const navigate = useNavigate();
    const breakpoint = useBreakpoint();
    const [name, setName] = useState<string | undefined>(undefined);
    const [nameErrorMessage, setNameErrorMessage] = useState<
        string | undefined
    >(undefined);
    const [emoji, setEmoji] = useState<null | string>(null);
    const [file, setFile] = useState<File | null>(null);

    const handleBack = () => {
        router.history.back();
    };

    const handleSuccess = () => {
        navigate({
            params: { slug: boardSlug, token },
            to: Routes.EditBoardByToken,
        });
    };

    const { isPending, mutate: createBoardFile } = useCreateBoardFile({
        boardSlug,
        onSuccess: handleSuccess,
        token,
    });

    const handleNameClear = () => {
        setName("");
    };

    const handleEmojiClear = () => handleEmojiChange(undefined);

    const handleEmojiChange = (emoji: Emoji | undefined) => {
        setEmoji(emoji?.colonCode ?? null);
    };

    const handleNameChange = async (event: FormEvent<HTMLInputElement>) => {
        const name = (event.target as HTMLInputElement).value;
        const validationState = validate(nameValidator, name);
        setNameErrorMessage(validationState?.firstError);
        setName(name);
    };

    const handleNameInput = async (event: FormEvent<HTMLInputElement>) => {
        const name = (event.target as HTMLInputElement).value;
        setName(name);
    };

    const handleFileChange = async (file: File | null | undefined) => {
        setFile(file ?? null);
    };

    const handleSubmit = () => {
        const validationState = validate(nameValidator, name);
        setNameErrorMessage(validationState?.firstError);
        if (validationState != null) {
            return;
        }

        const files: CreateBoardFileOptions[] = [
            {
                displayName: name ?? "",
                emoji: emoji ?? undefined,
                file: file!,
            },
        ];

        createBoardFile(files);
    };

    if (isPending) {
        return <FullScreenSpinner message="Creating Sound" />;
    }

    return (
        <Column css={{ width: "100%" }}>
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
                    display: "flex",
                    flexDirection: breakpoint === "mobile" ? "column" : "row",
                    gap: 16,
                    justifyContent: "stretch",
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
                        value={name}
                        width="100%"
                    />
                </Field>
                <Field fullWidth={true} label="Related Emoji">
                    <EmojiSelect
                        onClear={handleEmojiClear}
                        onSelect={handleEmojiChange}
                        value={getEmojiByColonCode(emoji ?? "")}
                    />
                </Field>
            </Box>
            <Row css={{ marginTop: 36, width: "100%" }}>
                <Field fullWidth={true}>
                    {breakpoint === "mobile" && (
                        <FileUpload
                            onChange={handleFileChange}
                            value={file ?? undefined}
                        />
                    )}
                </Field>
            </Row>
            {breakpoint === "mobile" && file != null && (
                <Row css={{ marginTop: 36, width: "100%" }}>
                    <CoolButton
                        intent="primary"
                        leftIcon="Checkmark"
                        onClick={handleSubmit}
                        width="100%">
                        Upload Sound
                    </CoolButton>
                </Row>
            )}
        </Column>
    );
};

export { CreateBoardFileForm };
