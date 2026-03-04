import { createFileRoute } from "@tanstack/react-router";
import { CreateBoardForm } from "@/components/new-board/create-board-form";

const CreateBoardPage: React.FC = () => {
    return <CreateBoardForm />;
};

const Route = createFileRoute("/create-board")({
    component: CreateBoardPage,
});

export { Route };
