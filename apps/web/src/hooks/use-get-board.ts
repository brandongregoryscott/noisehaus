import type {
    ApiError,
    ApiErrorResponse,
    Board,
    GetBoardResponse,
} from "common";
import { useQuery } from "@tanstack/react-query";
import { GET_BOARD_ROUTE } from "common";
import { isEmpty } from "lodash-es";
import { get } from "@/utils/fetch";
import { generateRoute } from "@/utils/route-utils";

type UseGetBoardOptions = {
    slug: string;
    token?: string;
};

const useGetBoard = (options: UseGetBoardOptions) => {
    const { slug, token } = options;
    const result = useQuery<Board, ApiError>({
        enabled: !isEmpty(slug),
        queryFn: async () => {
            const queryParams =
                token !== undefined && !isEmpty(token) ? { token } : undefined;
            const route = generateRoute(GET_BOARD_ROUTE, { slug }, queryParams);

            const { data, error } = await get<
                ApiErrorResponse | GetBoardResponse
            >(route);

            if (error !== null) {
                throw error;
            }

            return data;
        },
        queryKey: [GET_BOARD_ROUTE, slug],
    });

    return result;
};

export { useGetBoard };
