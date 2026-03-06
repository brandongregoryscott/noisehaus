import type {
    ApiError,
    Board,
    PresignedBoardFile,
    ViewPermission,
} from "common";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { ErrorName, GET_BOARD_ROUTE, LIST_BOARD_FILE_ROUTE } from "common";
import { BoardFileTable } from "@/components/board-file-table";
import { Button } from "@/components/button";
import { Column } from "@/components/column";
import { CoolButton } from "@/components/cool-button";
import { Field } from "@/components/field";
import { FullScreenSpinner } from "@/components/full-screen-spinner";
import { Heading } from "@/components/heading";
import { Icon } from "@/components/icon";
import { Input } from "@/components/input";
import { MobileHeader } from "@/components/mobile-header";
import { Row } from "@/components/row";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useDeleteBoardFile } from "@/hooks/use-delete-board-file";
import { useEditBoard } from "@/hooks/use-edit-board";
import { useToast } from "@/hooks/use-toast";
import { Routes } from "@/routes";

type EditBoardFormProps = {
    board: Board;
    boardFiles: PresignedBoardFile[];
    token: string;
};

const EditBoardForm: React.FC<EditBoardFormProps> = (props) => {
    const { board, boardFiles, token } = props;
    const breakpoint = useBreakpoint();
    const router = useRouter();
    const navigate = useNavigate();
    const { openDestructive } = useToast();
    const client = useQueryClient();
    const handleDeleteSuccess = () => {
        client.invalidateQueries({ queryKey: [LIST_BOARD_FILE_ROUTE] });
    };

    const { isPending: isDeletingBoardFile, mutate: deleteBoardFile } =
        useDeleteBoardFile({
            onSuccess: handleDeleteSuccess,
        });

    const {
        name: initialName,
        slug: initialSlug,
        view_permission: initialViewPermission,
    } = board;

    const handleAddClick = () => {
        navigate({
            params: { slug: board.slug, token },
            to: Routes.CreateSound,
        });
    };

    const handleDeleteBoardFile = (boardFileId: string) => {
        deleteBoardFile({ id: boardFileId, slug: board.slug, token });
    };

    const handleCancel = () => {
        navigate({
            params: { slug: board.slug, token },
            to: Routes.BoardByToken,
        });
    };

    const handleError = (error: ApiError) => {
        let message = error.message;
        if (
            error.name === ErrorName.ERROR_UNIQUE_CONSTRAINT &&
            error.message.includes("slug")
        ) {
            message = `The slug '${slug}' is already taken. Please choose another.`;
        }

        openDestructive({
            description: message,
            title: "Error updating board",
        });
    };

    const handleSuccess = () => {
        client.invalidateQueries({
            queryKey: [GET_BOARD_ROUTE, initialSlug],
        });

        if (slug !== initialSlug) {
            navigate({
                params: { slug, token },
                to: Routes.BoardByToken,
            });
        }

        router.history.back();
    };

    const {
        handleNameChange,
        handleNameClear,
        handleNameInput,
        handleSave,
        handleSlugChange,
        handleSlugClear,
        handleSlugInput,
        isPending: isSavingBoard,
        name,
        nameErrorMessage,
        slug,
        slugErrorMessage,
    } = useEditBoard({
        initialName,
        initialSlug,
        initialViewPermission: initialViewPermission as ViewPermission,
        onError: handleError,
        onSuccess: handleSuccess,
        token,
    });

    if (isSavingBoard || isDeletingBoardFile) {
        const message = isSavingBoard ? "Saving Board" : "Deleting Sound";
        return <FullScreenSpinner message={message} />;
    }

    return (
        <Column css={{ justifyContent: "stretch", width: "100%" }}>
            {breakpoint === "mobile" && (
                <MobileHeader
                    leftContent={
                        <Button
                            fillStyle="Ghost"
                            onClick={handleCancel}
                            size="Small">
                            <Icon name="ChevronLeft" />
                            Cancel
                        </Button>
                    }
                />
            )}
            <Column css={{ gap: 16, marginTop: 16, width: "100%" }}>
                <Row
                    css={{
                        justifyContent: "center",
                        marginBottom: 36,
                        width: "100%",
                    }}>
                    <Heading size="h1">Edit Board</Heading>
                </Row>
                <Field fullWidth={true} label="Board Name">
                    <Input
                        errorMessage={nameErrorMessage}
                        onChange={handleNameChange}
                        onClear={handleNameClear}
                        onInput={handleNameInput}
                        placeholder="Board Name"
                        showClearAffordance={true}
                        value={name}
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
                        value={slug}
                        width="100%"
                    />
                </Field>
                <Field fullWidth={true} label="Sounds">
                    <BoardFileTable
                        boardFiles={boardFiles}
                        onDelete={handleDeleteBoardFile}
                        token={token}
                    />
                </Field>
                <Column
                    css={{
                        gap: 16,
                        marginY: 36,
                        paddingRight: 16,
                        width: "100%",
                    }}>
                    <CoolButton onClick={handleAddClick} width="100%">
                        Add Sound
                    </CoolButton>
                    <CoolButton
                        intent="primary"
                        onClick={handleSave}
                        width="100%">
                        Save Board
                    </CoolButton>
                </Column>
            </Column>
        </Column>
    );
};

export { EditBoardForm };
