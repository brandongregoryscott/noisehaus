import type { Board } from "common";
import React from "react";
import { Box } from "@/components/box";
import { Button } from "@/components/button";
import { CreateBoardFileDialog } from "@/components/create-board-file-dialog";
import { DeleteBoardConfirmation } from "@/components/delete-board-confirmation";
import { EditBoardDialog } from "@/components/edit-board-dialog";
import { Icon } from "@/components/icon";
import { IconButton } from "@/components/icon-button";
import { Popover } from "@/components/popover";
import { ShareLinkDialog } from "@/components/share-link-dialog";
import { useBoardSettingsMenu } from "@/hooks/use-board-settings-menu";

type BoardSettingsMenuProps = {
    board: Board;
    token?: string;
};

const BoardSettingsMenu: React.FC<BoardSettingsMenuProps> = (props) => {
    const { board, token } = props;
    const {
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
    } = useBoardSettingsMenu({ board, token });

    return (
        <>
            <Popover.Root>
                <Popover.Trigger asChild={true}>
                    <IconButton fillStyle="Ghost" iconName="Cog" />
                </Popover.Trigger>
                <Popover.Portal>
                    <Popover.Content>
                        <Button
                            align="left"
                            fillStyle="Ghost"
                            onClick={handleOpenShareDialog}
                            width="100%">
                            <Icon name="Link" />
                            <span>Share Link</span>
                        </Button>
                        {token !== undefined && (
                            <>
                                <Button
                                    align="left"
                                    fillStyle="Ghost"
                                    onClick={handleOpenAddDialog}
                                    width="100%">
                                    <Icon name="Plus" />
                                    <span>Add Sound</span>
                                </Button>
                                <Button
                                    align="left"
                                    fillStyle="Ghost"
                                    onClick={handleOpenEditDialog}
                                    width="100%">
                                    <Icon name="Pencil" />
                                    <span>Edit Board</span>
                                </Button>
                                <Button
                                    align="left"
                                    fillStyle="Ghost"
                                    onClick={handleOpenDeleteConfirmation}
                                    width="100%">
                                    <Icon name="Trashcan" />
                                    <span>Delete Board</span>
                                </Button>
                            </>
                        )}
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>
            {isShareDialogOpen && (
                <ShareLinkDialog
                    board={board}
                    isOpen={isShareDialogOpen}
                    onClose={handleCloseShareDialog}
                    token={token}
                />
            )}
            {isDeleteConfirmationOpen && (
                <DeleteBoardConfirmation
                    isLoading={isDeletingBoard}
                    isOpen={isDeleteConfirmationOpen}
                    onClose={handleCloseDeleteConfirmation}
                    onConfirm={handleConfirmDelete}
                />
            )}
            {isEditDialogOpen && token !== undefined && (
                <EditBoardDialog
                    board={board}
                    isOpen={isEditDialogOpen}
                    onClose={handleCloseEditDialog}
                    token={token}
                />
            )}
            {isAddDialogOpen && token !== undefined && (
                <CreateBoardFileDialog
                    boardSlug={board.slug}
                    isOpen={isAddDialogOpen}
                    onClose={handleCloseAddDialog}
                    token={token}
                />
            )}
        </>
    );
};

export { BoardSettingsMenu };
