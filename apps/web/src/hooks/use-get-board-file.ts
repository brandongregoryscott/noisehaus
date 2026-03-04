import type {
    ApiError,
    ApiErrorResponse,
    ApiSuccessResponse,
    BoardFile,
} from "common";
import { useQuery } from "@tanstack/react-query";
import { GET_BOARD_FILE_ROUTE } from "common";
import { isEmpty } from "lodash-es";
import { get } from "@/utils/fetch";
import { generateRoute } from "@/utils/route-utils";

type UseGetBoardFileOptions = {
    boardSlug: string;
    id: string;
};

const useGetBoardFile = (options: UseGetBoardFileOptions) => {
    const { boardSlug, id } = options;
    const result = useQuery<BoardFile, ApiError>({
        enabled: !isEmpty(boardSlug) && !isEmpty(id),
        queryFn: async () => {
            const route = generateRoute(GET_BOARD_FILE_ROUTE, {
                id,
                slug: boardSlug,
            });

            const { data, error } = await get<
                ApiErrorResponse | ApiSuccessResponse<BoardFile>
            >(route);

            if (error !== null) {
                throw error;
            }

            return data;
        },
        queryKey: [GET_BOARD_FILE_ROUTE, boardSlug, id],
    });

    return result;
};

export { useGetBoardFile };
