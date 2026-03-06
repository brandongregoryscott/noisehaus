import type { PresignedBoardFile } from "common";
import { useCallback } from "react";
import { useListBoardFiles } from "@/hooks/use-list-board-files";

type UseGetBoardFileOptions = {
    boardSlug: string;
    id: string;
    token: string | undefined;
};

const useGetBoardFile = (options: UseGetBoardFileOptions) => {
    const { boardSlug, id, token } = options;

    const selectById = useCallback(
        (boardFiles: PresignedBoardFile[]) =>
            boardFiles.find((boardFile) => boardFile.id === id),
        [id]
    );

    const result = useListBoardFiles({ boardSlug, select: selectById, token });

    return result;
};

export { useGetBoardFile };
