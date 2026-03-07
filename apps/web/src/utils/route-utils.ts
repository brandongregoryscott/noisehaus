import { isEmpty } from "lodash-es";
import type { PathParam } from "@/utils/vendor/react-router";
import { generatePath } from "@/utils/vendor/react-router";

/**
 * Note: Since we're using Tanstack Router now, we get a lot of strongly typed client-side routing
 * for free. This is mostly for building API routes.
 */
const generateRoute = <T extends string>(
    path: T,
    params: {
        [key in PathParam<T>]: string;
    },
    queryParams?: Record<string, string>
): string => {
    const route = generatePath(path, params);

    if (isEmpty(queryParams)) {
        return route;
    }

    const searchParams = new URLSearchParams(queryParams);
    return `${route}?${searchParams}`;
};

const prependDomain = (route: string): string =>
    `https://noise.haus${route.startsWith("/") ? route : `/${route}`}`;

export { generateRoute, prependDomain };
