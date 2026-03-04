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
                            fillStyle="Ghost"
                            onClick={handleOpenShareDialog}>
                            <Box
                                css={{
                                    alignItems: "center",
                                    display: "flex",
                                    gap: 4,
                                }}>
                                <Icon name="Link" />
                                <span>Share Link</span>
                            </Box>
                        </Button>
                        {token !== undefined && (
                            <>
                                <Button
                                    fillStyle="Ghost"
                                    onClick={handleOpenAddDialog}>
                                    <Box
                                        css={{
                                            alignItems: "center",
                                            display: "flex",
                                            gap: 4,
                                        }}>
                                        <Icon name="Plus" />
                                        <span>Add Sound</span>
                                    </Box>
                                </Button>
                                <Button
                                    fillStyle="Ghost"
                                    onClick={handleOpenEditDialog}>
                                    <Box
                                        css={{
                                            alignItems: "center",
                                            display: "flex",
                                            gap: 4,
                                        }}>
                                        <Icon name="Pencil" />
                                        <span>Edit Board</span>
                                    </Box>
                                </Button>
                                <Button
                                    fillStyle="Ghost"
                                    onClick={handleOpenDeleteConfirmation}>
                                    <Box
                                        css={{
                                            alignItems: "center",
                                            display: "flex",
                                            gap: 4,
                                        }}>
                                        <Icon name="Trashcan" />
                                        <span>Delete Board</span>
                                    </Box>
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
