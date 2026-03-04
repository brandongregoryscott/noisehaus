import { createFileRoute } from "@tanstack/react-router";
import { EditBoardForm } from "@/components/edit-board-form";
import { FullScreenErrorDisplay } from "@/components/full-screen-error-display";
import { FullScreenSpinner } from "@/components/full-screen-spinner";
import { useGetBoard } from "@/hooks/use-get-board";
import { useListBoardFiles } from "@/hooks/use-list-board-files";

const EditBoardPage: React.FC = () => {
    const { slug, token } = Route.useParams();
    const {
        data: board,
        error: boardError,
        isLoading: isLoadingBoard,
    } = useGetBoard({ slug, token });
    const {
        data: boardFiles,
        error: boardFilesError,
        isLoading: isLoadingBoardFiles,
    } = useListBoardFiles({ boardSlug: slug, token });

    const isLoading = isLoadingBoard || isLoadingBoardFiles;
    const error = boardError ?? boardFilesError;

    if (isLoading) {
        return <FullScreenSpinner />;
    }

    if (error != null) {
        return <FullScreenErrorDisplay {...error} />;
    }

    return (
        <EditBoardForm
            board={board!}
            boardFiles={boardFiles ?? []}
            token={token}
        />
    );
};

const Route = createFileRoute("/boards/$slug/$token/edit/")({
    component: EditBoardPage,
});

export { Route };
