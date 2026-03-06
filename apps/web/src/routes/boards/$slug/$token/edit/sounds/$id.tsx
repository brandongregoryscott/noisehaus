import { createFileRoute } from "@tanstack/react-router";
import { EditBoardFileForm } from "@/components/edit-board-file-form";
import { FullScreenErrorDisplay } from "@/components/full-screen-error-display";
import { FullScreenSpinner } from "@/components/full-screen-spinner";
import { useGetBoard } from "@/hooks/use-get-board";
import { useGetBoardFile } from "@/hooks/use-get-board-file";

const EditBoardFilePage: React.FC = () => {
    const { id, slug, token } = Route.useParams();
    const { error: boardError, isLoading: isLoadingBoard } = useGetBoard({
        slug,
        token,
    });

    const {
        data: boardFile,
        error: boardFileError,
        isLoading: isLoadingBoardFile,
    } = useGetBoardFile({ boardSlug: slug, id, token });

    const isLoading = isLoadingBoard || isLoadingBoardFile;
    const error = boardError ?? boardFileError;

    if (isLoading) {
        return <FullScreenSpinner />;
    }

    if (error != null) {
        return <FullScreenErrorDisplay {...error} />;
    }

    return <EditBoardFileForm boardFile={boardFile!} token={token} />;
};

const Route = createFileRoute("/boards/$slug/$token/edit/sounds/$id")({
    component: EditBoardFilePage,
});

export { Route };
