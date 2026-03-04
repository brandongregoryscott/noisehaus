import { createFileRoute } from "@tanstack/react-router";
import { CreateBoardFileForm } from "@/components/existing-board/create-board-file-form";
import { FullScreenErrorDisplay } from "@/components/full-screen-error-display";
import { FullScreenSpinner } from "@/components/full-screen-spinner";
import { useGetBoard } from "@/hooks/use-get-board";

const CreateBoardFilePage: React.FC = () => {
    const { slug: boardSlug, token } = Route.useParams();
    const { error, isLoading } = useGetBoard({ slug: boardSlug, token });

    if (isLoading) {
        return <FullScreenSpinner />;
    }

    if (error != null) {
        return <FullScreenErrorDisplay {...error} />;
    }

    return <CreateBoardFileForm boardSlug={boardSlug} token={token} />;
};

const Route = createFileRoute("/boards/$slug/$token/edit/sounds/create")({
    component: CreateBoardFilePage,
});

export { Route };
