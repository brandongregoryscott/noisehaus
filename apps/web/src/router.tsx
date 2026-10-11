import { createRouter } from "@tanstack/react-router";
import { routeTree } from "@/generated/route-tree";

function getRouter() {
    return createRouter({
        routeTree,
        scrollRestoration: true,
    });
}

declare module "@tanstack/react-router" {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- Declaration merging requires an interface
    interface Register {
        router: ReturnType<typeof getRouter>;
    }
}

export { getRouter };
