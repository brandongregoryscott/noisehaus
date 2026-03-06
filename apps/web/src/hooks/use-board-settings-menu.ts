import type { Board } from "common";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { GET_BOARD_ROUTE } from "common";
import { useBoolean } from "@/hooks/use-boolean";
import { useDeleteBoard } from "@/hooks/use-delete-board";
import { Routes } from "@/routes";

type UseBoardSettingsMenuOptions = {
    board: Board;
    token: string | undefined;
};

const useBoardSettingsMenu = (options: UseBoardSettingsMenuOptions) => {
    const { board, token } = options;
    const navigate = useNavigate();
    const client = useQueryClient();
    const handleDeleteSuccess = () => {
        client.invalidateQueries({ queryKey: [GET_BOARD_ROUTE] });
        navigate({ to: Routes.Home });
    };
    const { isPending: isDeletingBoard, mutate: deleteBoard } = useDeleteBoard({
        onSuccess: handleDeleteSuccess,
    });
    const {
        setFalse: handleCloseAddDialog,
        setTrue: handleOpenAddDialog,
        value: isAddDialogOpen,
    } = useBoolean(false);

    const {
        setFalse: handleCloseShareDialog,
        setTrue: handleOpenShareDialog,
        value: isShareDialogOpen,
    } = useBoolean(false);
    const {
        setFalse: handleCloseEditDialog,
        setTrue: handleOpenEditDialog,
        value: isEditDialogOpen,
    } = useBoolean(false);
    const {
        setFalse: handleCloseDeleteConfirmation,
        setTrue: handleOpenDeleteConfirmation,
        value: isDeleteConfirmationOpen,
    } = useBoolean(false);

    const handleConfirmDelete = () => {
        deleteBoard({ slug: board.slug, token: token! });
    };

    return {
        handleCloseAddDialog,
        handleCloseDeleteConfirmation,
        handleCloseEditDialog,
        handleCloseShareDialog,
        handleConfirmDelete,
        handleOpenAddDialog,
        handleOpenDeleteConfirmation,
        handleOpenEditDialog,
        handleOpenShareDialog,
        isAddDialogOpen,
        isDeleteConfirmationOpen,
        isDeletingBoard,
        isEditDialogOpen,
        isShareDialogOpen,
    };
};

export { useBoardSettingsMenu };
