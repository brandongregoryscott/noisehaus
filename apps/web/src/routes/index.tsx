import { createFileRoute } from "@tanstack/react-router";
import { CreateBoardFileForm } from "@/components/new-board/create-board-file-form";

const HomePage: React.FC = () => {
    return <CreateBoardFileForm />;
};

const Route = createFileRoute("/")({
    component: HomePage,
});

export { Route };
