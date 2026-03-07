import { createFileRoute } from "@tanstack/react-router";
import { BoardByTokenPage } from "../../../../boards/$slug/token/$token";

const Route = createFileRoute("/b/$slug/t/$token/")({
    component: BoardByTokenPage,
});

export { Route };
