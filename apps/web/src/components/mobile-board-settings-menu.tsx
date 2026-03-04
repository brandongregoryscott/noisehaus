import type { Board } from "common";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/button";
import { DeleteBoardConfirmation } from "@/components/delete-board-confirmation";
import { Row } from "@/components/row";
import { ShareLinkDialog } from "@/components/share-link-dialog";
import { SingleItemAccordion } from "@/components/single-item-accordion";
import { useBoardSettingsMenu } from "@/hooks/use-board-settings-menu";
import { Routes } from "@/routes";

type MobileBoardSettingsMenuProps = {
    board: Board;
    isOpen: boolean;
    token: string | undefined;
};

const MobileBoardSettingsMenu: React.FC<MobileBoardSettingsMenuProps> = (
    props
) => {
    const { board, isOpen, token } = props;
    const navigate = useNavigate();
    const {
        handleCloseDeleteConfirmation,
        handleCloseShareDialog,
        handleConfirmDelete,
        handleOpenShareDialog,
        isDeleteConfirmationOpen,
        isDeletingBoard,
        isShareDialogOpen,
    } = useBoardSettingsMenu({ board, token });

    const handleEditClick = () => {
        navigate({
            params: { slug: board.slug, token: token ?? "" },
            to: Routes.EditBoardByToken,
        });
    };

    const handleAddClick = () => {
        navigate({
            params: { slug: board.slug, token: token ?? "" },
            to: Routes.CreateSound,
        });
    };

    const buttonWidth = token != null ? "33%" : "100%";
    return (
        <>
            <SingleItemAccordion isOpen={isOpen}>
                <Row
                    css={{
                        gap: 16,
                        justifyContent: "space-between",
                        marginTop: 16,
                        paddingX: 16,
                        width: "100%",
                    }}>
                    {token != null && (
                        <>
                            <Button
                                onClick={handleAddClick}
                                size="Small"
                                width={buttonWidth}>
                                Add Sound
                            </Button>
                            <Button
                                onClick={handleEditClick}
                                size="Small"
                                width={buttonWidth}>
                                Edit Board
                            </Button>
                        </>
                    )}
                    <Button
                        onClick={handleOpenShareDialog}
                        size="Small"
                        width={buttonWidth}>
                        Share
                    </Button>
                </Row>
            </SingleItemAccordion>
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
        </>
    );
};

export { MobileBoardSettingsMenu };
