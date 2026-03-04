import type { BoardFile } from "common";
import { useNavigate } from "@tanstack/react-router";
import { colonCodeToUnicode } from "common";
import { isEmpty } from "lodash-es";
import { useState } from "react";
import { Column } from "@/components/column";
import { DeleteBoardFileConfirmation } from "@/components/delete-board-file-confirmation";
import { IconButton } from "@/components/icon-button";
import { Row } from "@/components/row";
import { Text } from "@/components/text";
import { useBoolean } from "@/hooks/use-boolean";
import { Routes } from "@/routes";

type BoardFileTableProps = {
    boardFiles: BoardFile[];
    onDelete: (boardFileId: string) => void;
    token: string | undefined;
};

const EMOJI_COLUMN_WIDTH = "15%";
const NAME_COLUMN_WIDTH = "55%";
const ACTIONS_COLUMN_WIDTH = "25%";

const BoardFileTable: React.FC<BoardFileTableProps> = (props) => {
    const { boardFiles, onDelete, token } = props;
    const navigate = useNavigate();

    const [selectedBoardFileId, setSelectedBoardFileId] = useState<
        string | undefined
    >(undefined);
    const {
        setFalse: handleCloseDeleteConfirmation,
        setTrue: handleOpenDeleteConfirmation,
        value: isDeleteConfirmationOpen,
    } = useBoolean();
    const handleEditClick = (boardFile: BoardFile) => () => {
        if (isEmpty(token)) {
            return;
        }

        navigate({
            params: {
                id: boardFile.id,
                slug: boardFile.board_slug,
                token: token ?? "",
            },
            to: Routes.EditSound,
        });
    };

    const handleDeleteClick = (boardFile: BoardFile) => () => {
        setSelectedBoardFileId(boardFile.id);
        handleOpenDeleteConfirmation();
    };

    const handleConfirmDelete = () => {
        if (selectedBoardFileId === undefined) {
            return;
        }

        onDelete(selectedBoardFileId);
    };

    const handleCancelDelete = () => {
        setSelectedBoardFileId(undefined);
        handleCloseDeleteConfirmation();
    };

    return (
        <Column css={{ gap: 8, width: "100%" }}>
            <Row css={{ gap: 8, width: "100%" }}>
                <Row css={{ width: EMOJI_COLUMN_WIDTH }}>
                    <Text as="code">Emoji</Text>
                </Row>
                <Row css={{ width: NAME_COLUMN_WIDTH }}>
                    <Text as="code">Name</Text>
                </Row>
                {token !== undefined && (
                    <Row
                        css={{
                            justifyContent: "flex-end",
                            width: ACTIONS_COLUMN_WIDTH,
                        }}>
                        <Text as="code">Actions</Text>
                    </Row>
                )}
            </Row>
            {boardFiles.map((boardFile) => (
                <Row css={{ gap: 8, width: "100%" }} key={boardFile.id}>
                    <Row css={{ width: EMOJI_COLUMN_WIDTH }}>
                        {colonCodeToUnicode(boardFile.emoji ?? "") ?? "--"}
                    </Row>
                    <Row css={{ width: NAME_COLUMN_WIDTH }}>
                        <Text>{boardFile.display_name}</Text>
                    </Row>
                    {token !== undefined && (
                        <Row
                            css={{
                                justifyContent: "flex-end",
                                width: ACTIONS_COLUMN_WIDTH,
                            }}>
                            <IconButton
                                fillStyle="Ghost"
                                iconName="Pencil"
                                onClick={handleEditClick(boardFile)}
                                size="Small"
                            />
                            <IconButton
                                colorType="Destructive"
                                fillStyle="Ghost"
                                iconName="Trashcan"
                                onClick={handleDeleteClick(boardFile)}
                                size="Small"
                            />
                        </Row>
                    )}
                </Row>
            ))}
            {isDeleteConfirmationOpen && (
                <DeleteBoardFileConfirmation
                    isLoading={false}
                    isOpen={isDeleteConfirmationOpen}
                    onClose={handleCancelDelete}
                    onConfirm={handleConfirmDelete}
                />
            )}
        </Column>
    );
};

export { BoardFileTable };
