import { createRouter } from "@tanstack/react-router";
import { routeTree } from "@/generated/route-tree";

function getRouter() {
    return createRouter({
        routeTree,
        scrollRestoration: true,
    });
}

declare module "@tanstack/react-router" {
    /* @ts-ignore */
    type Register = {
        router: ReturnType<typeof getRouter>;
    };
}

export { getRouter };
