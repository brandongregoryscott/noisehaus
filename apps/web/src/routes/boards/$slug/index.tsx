import { createFileRoute } from "@tanstack/react-router";
import { BoardBySlugPage as SharedBoardBySlugPage } from "@/pages/board-by-slug-page";

const BoardBySlugPage: React.FC = () => {
    const { slug } = Route.useParams();
    return <SharedBoardBySlugPage slug={slug} />;
};

const Route = createFileRoute("/boards/$slug/")({
    component: BoardBySlugPage,
});

export { Route };
