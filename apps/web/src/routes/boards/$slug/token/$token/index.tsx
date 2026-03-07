import { createFileRoute } from "@tanstack/react-router";
import { BoardByTokenPage as SharedBoardByTokenPage } from "@/pages/board-by-token-page";

const BoardByTokenPage: React.FC = () => {
    const { slug, token } = Route.useParams();
    return <SharedBoardByTokenPage slug={slug} token={token} />;
};

const Route = createFileRoute("/boards/$slug/token/$token/")({
    component: BoardByTokenPage,
});

export { Route };
