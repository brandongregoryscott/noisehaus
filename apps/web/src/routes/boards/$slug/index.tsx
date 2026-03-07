import { createFileRoute } from "@tanstack/react-router";
import { Board } from "@/components/board";
import { FullScreenErrorDisplay } from "@/components/full-screen-error-display";
import { FullScreenSpinner } from "@/components/full-screen-spinner";
import { useGetBoard } from "@/hooks/use-get-board";
import { useListBoardFiles } from "@/hooks/use-list-board-files";

const BoardBySlugPage: React.FC = () => {
    const { slug } = Route.useParams();
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

const Route = createFileRoute("/boards/$slug/")({
    component: BoardBySlugPage,
});

export { BoardBySlugPage, Route };
