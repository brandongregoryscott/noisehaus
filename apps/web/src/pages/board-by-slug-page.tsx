import { Board } from "@/components/board";
import { FullScreenErrorDisplay } from "@/components/full-screen-error-display";
import { FullScreenSpinner } from "@/components/full-screen-spinner";
import { useGetBoard } from "@/hooks/use-get-board";
import { useListBoardFiles } from "@/hooks/use-list-board-files";

type BoardBySlugPageProps = {
    slug: string;
};

const BoardBySlugPage: React.FC<BoardBySlugPageProps> = (props) => {
    const { slug } = props;
    const {
        data: board,
        error: boardError,
        isLoading: isLoadingBoard,
    } = useGetBoard({ slug });
    const {
        data: boardFiles,
        error: boardFilesError,
        isLoading: isLoadingBoardFiles,
    } = useListBoardFiles({ boardSlug: slug, token: undefined });

    const isLoading = isLoadingBoard || isLoadingBoardFiles;
    const error = boardError ?? boardFilesError;

    if (isLoading) {
        return <FullScreenSpinner />;
    }

    if (error != null) {
        return <FullScreenErrorDisplay {...error} />;
    }

    return <Board board={board!} boardFiles={boardFiles ?? []} />;
};

export { BoardBySlugPage };
