import { createFileRoute } from "@tanstack/react-router";
import { BoardBySlugPage } from "../../boards/$slug";

const Route = createFileRoute("/b/$slug/")({
    component: BoardBySlugPage,
});

export { Route };
