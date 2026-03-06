import type { ApiError } from "common/api/errors";
import type { FormEvent } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { ErrorName } from "common/api/errors";
import { isEmpty, kebabCase } from "lodash-es";
import { useState } from "react";
import type { CreateBoardMutationResult } from "@/hooks/use-create-board";
import type { CreateBoardFileOptions } from "@/hooks/use-create-board-file";
import { Box } from "@/components/box";
import { Button } from "@/components/button";
import { Column } from "@/components/column";
import { CoolButton } from "@/components/cool-button";
import { Field } from "@/components/field";
import { Heading } from "@/components/heading";
import { Icon } from "@/components/icon";
import { Input } from "@/components/input";
import { MobileHeader } from "@/components/mobile-header";
import { Row } from "@/components/row";
import { Text } from "@/components/text";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useCreateBoard } from "@/hooks/use-create-board";
import { useCreateContext } from "@/hooks/use-create-context";
import { useToast } from "@/hooks/use-toast";
import { Routes } from "@/routes";
import { generateSlug } from "@/utils/string-utils";
import { validate } from "@/utils/validation";
import {
    nameValidator,
    slugValidator,
} from "@/utils/validators/board-validators";

const CreateBoardForm: React.FC = () => {
    const router = useRouter();
    const navigate = useNavigate();
    const breakpoint = useBreakpoint();
    const {
        boardName,
        boardSlug,
        file,
        fileDisplayName,
        fileEmoji,
        resetState,
        setBoardName,
        setBoardSlug,
    } = useCreateContext();
    if (isEmpty(boardSlug)) {
        setBoardSlug(generateSlug());
    }

    const hasFiles = file !== null;
    const [nameErrorMessage, setNameErrorMessage] = useState<
        string | undefined
    >(undefined);
    const [slugErrorMessage, setSlugErrorMessage] = useState<
        string | undefined
    >(undefined);
    const { openConstructive, openDestructive } = useToast();

    const handleBack = () => {
        router.history.back();
    };

    const handleError = (error: ApiError) => {
        let message = error.message;
        if (
            error.name === ErrorName.ERROR_UNIQUE_CONSTRAINT &&
            error.message.includes("slug")
        ) {
            message = `The slug '${boardSlug}' is already taken. Please choose another.`;
        }

        openDestructive({
            description: message,
            title: "Error creating board",
        });
    };

    const handleSuccess = (response: CreateBoardMutationResult) => {
        const { data: board, error } = response;

        if (error !== null) {
            openDestructive({
                description: (error as ApiError).message,
                title: "Error uploading files",
            });
        }

        resetState();

        if (breakpoint !== "mobile") {
            openConstructive({
                description: `Your board '${board.name}' was successfully created.`,
                durationInMs: 5000,
                title: "Board created!",
            });
        }
        navigate({
            params: { slug: board.slug, token: board.token },
            to: Routes.BoardByToken,
        });
    };
    const { isPending: isCreatingBoard, mutate: createBoard } = useCreateBoard({
        onError: handleError,
        onSuccess: handleSuccess,
    });

    const handleNameClear = () => setBoardName("");
    const handleSlugClear = () => setBoardSlug("");

    const handleNameInput = (event: FormEvent<HTMLInputElement>) => {
        const name = (event.target as HTMLInputElement).value;
        setBoardName(name);
        if (isEmpty(boardSlug)) {
            setBoardSlug(kebabCase(name));
        }
    };

    const handleNameChange = (event: FormEvent<HTMLInputElement>) => {
        const name = (event.target as HTMLInputElement).value;
        setBoardName(name);

        if (isEmpty(boardSlug)) {
            setBoardSlug(kebabCase(name));
        }
    };

    const handleSlugChange = (event: FormEvent<HTMLInputElement>) => {
        setBoardSlug((event.target as HTMLInputElement).value);
    };

    const handleSlugInput = (event: FormEvent<HTMLInputElement>) => {
        setBoardSlug((event.target as HTMLInputElement).value);
    };

    const handleCreate = async () => {
        const nameValidationState = validate(nameValidator, boardName);
        const slugValidationState = validate(slugValidator, boardSlug);

        if (nameValidationState !== undefined) {
            setNameErrorMessage(nameValidationState?.firstError);
        }

        if (slugValidationState !== undefined) {
            setSlugErrorMessage(slugValidationState?.firstError);
        }

        if (
            nameValidationState !== undefined ||
            slugValidationState !== undefined
        ) {
            return;
        }

        const files: CreateBoardFileOptions[] = [
            { displayName: fileDisplayName, emoji: fileEmoji, file: file! },
        ];
        createBoard({ files, name: boardName, slug: boardSlug });
    };

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
            <Column css={{ gap: 8, width: "100%" }}>
                <Box
                    css={{
                        justifyContent:
                            breakpoint === "mobile" ? "center" : "left",
                        marginTop: 32,
                        width: "100%",
                    }}>
                    <Heading size="h2">Create Board</Heading>
                </Box>
                <Row css={{ width: "100%" }}>
                    <Text as="code" textAlign="center">
                        Boards hold all of your sounds and allow you to share
                        them.
                    </Text>
                </Row>
            </Column>
            <Box
                css={{
                    alignItems: "stretch",
                    display: "flex",
                    flexDirection: breakpoint === "mobile" ? "column" : "row",
                    gap: 16,
                    marginTop: 36,
                    width: "100%",
                }}>
                <Field fullWidth={true} label="Board Name">
                    <Input
                        errorMessage={nameErrorMessage}
                        onChange={handleNameChange}
                        onClear={handleNameClear}
                        onInput={handleNameInput}
                        placeholder="Board Name"
                        showClearAffordance={true}
                        value={boardName}
                        width="100%"
                    />
                </Field>
                <Field fullWidth={true} label="Board Slug">
                    <Input
                        errorMessage={slugErrorMessage}
                        onChange={handleSlugChange}
                        onClear={handleSlugClear}
                        onInput={handleSlugInput}
                        placeholder="Board Slug"
                        showClearAffordance={true}
                        value={boardSlug}
                        width="100%"
                    />
                </Field>
            </Box>
            {breakpoint === "desktop" && (
                <Row
                    css={{
                        gap: 8,
                        justifyContent: "flex-end",
                        marginTop: 36,
                        width: "100%",
                    }}>
                    {hasFiles && (
                        <Button
                            fillStyle="Ghost"
                            onClick={() => {
                                router.history.back();
                            }}>
                            <Icon name="ArrowLeft" />
                            Upload a Sound
                        </Button>
                    )}
                    {!hasFiles && (
                        <Button
                            onClick={() => {
                                router.history.push(Routes.Home);
                            }}>
                            Upload a Sound
                            <Icon name="ArrowRight" />
                        </Button>
                    )}
                    {hasFiles && (
                        <Button
                            isLoading={isCreatingBoard}
                            onClick={handleCreate}>
                            Create
                            <Icon name="ArrowRight" />
                        </Button>
                    )}
                </Row>
            )}
            {breakpoint === "mobile" && (
                <Row css={{ marginTop: 36, width: "100%" }}>
                    <CoolButton
                        intent="primary"
                        leftIcon="Checkmark"
                        onClick={handleCreate}
                        width="100%">
                        Create Board
                    </CoolButton>
                </Row>
            )}
        </Column>
    );
};

export { CreateBoardForm };
