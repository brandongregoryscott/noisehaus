import type { PresignedBoardFile, Board as BoardEntity } from "common";
import { BoardFileButton } from "@/components/board-file-button";
import { BoardSettingsMenu } from "@/components/board-settings-menu";
import { Column } from "@/components/column";
import { CreateBoardFileDialog } from "@/components/create-board-file-dialog";
import { Heading } from "@/components/heading";
import { IconButton } from "@/components/icon-button";
import { MobileBoardSettingsMenu } from "@/components/mobile-board-settings-menu";
import { MobileHeader } from "@/components/mobile-header";
import { Row } from "@/components/row";
import { Text } from "@/components/text";
import { useBoolean } from "@/hooks/use-boolean";
import { useBreakpoint } from "@/hooks/use-breakpoint";

type BoardProps = {
    board: BoardEntity;
    boardFiles: PresignedBoardFile[];
    token?: string;
};

const Board: React.FC<BoardProps> = (props) => {
    const { board, boardFiles, token } = props;
    const breakpoint = useBreakpoint();
    const {
        setFalse: handleCloseFileDialog,
        setTrue: handleOpenFileDialog,
        value: isFileDialogOpen,
    } = useBoolean(false);
    const {
        toggle: toggleMobileBoardSettingsMenu,
        value: isMobileBoardSettingsMenuOpen,
    } = useBoolean(false);

    return (
        <Column css={{ justifyContent: "stretch", width: "100%" }}>
            {breakpoint === "mobile" && (
                <MobileHeader
                    rightContent={
                        <IconButton
                            fillStyle="Ghost"
                            iconName="Cog"
                            onClick={toggleMobileBoardSettingsMenu}
                        />
                    }
                />
            )}
            {breakpoint === "desktop" && (
                <Row css={{ justifyContent: "space-between" }}>
                    <Heading size="h2">{board.name}</Heading>
                    <BoardSettingsMenu board={board} token={token} />
                </Row>
            )}
            {breakpoint === "mobile" && (
                <Column
                    css={{
                        justifyContent: "center",
                        marginTop: 16,
                        width: "100%",
                    }}>
                    <Text fontWeight="bold">{board.name}</Text>
                </Column>
            )}
            <MobileBoardSettingsMenu
                board={board}
                isOpen={isMobileBoardSettingsMenuOpen}
                token={token}
            />
            <Row
                css={{
                    flexWrap: "wrap",
                    gap: 16,
                    marginTop: 36,
                    width: "100%",
                }}>
                {boardFiles.map((boardFile) => (
                    <BoardFileButton boardFile={boardFile} key={boardFile.id} />
                ))}
            </Row>
            {isFileDialogOpen && token !== undefined && (
                <CreateBoardFileDialog
                    boardSlug={board.slug}
                    isOpen={isFileDialogOpen}
                    onClose={handleCloseFileDialog}
                    token={token}
                />
            )}
        </Column>
    );
};

export type { BoardProps };
export { Board };
