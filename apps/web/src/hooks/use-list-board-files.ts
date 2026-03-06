import type {
    ApiError,
    ApiErrorResponse,
    ListBoardFilesResponse,
    PresignedBoardFile,
} from "common";
import { useQuery } from "@tanstack/react-query";
import { LIST_BOARD_FILE_ROUTE } from "common";
import { isEmpty } from "lodash-es";
import { get } from "@/utils/fetch";
import { generateRoute } from "@/utils/route-utils";

type UseListBoardFilesOptions<TData> = {
    boardSlug: string;
    select?: (boardFiles: PresignedBoardFile[]) => TData;
    token: string | undefined;
};

const useListBoardFiles = <TData = PresignedBoardFile[]>(
    options: UseListBoardFilesOptions<TData>
) => {
    const { boardSlug, select, token } = options;
    const result = useQuery<PresignedBoardFile[], ApiError, TData>({
        enabled: !isEmpty(boardSlug),
        queryFn: async () => {
            const queryParams =
                token !== undefined && !isEmpty(token) ? { token } : undefined;
            const route = generateRoute(
                LIST_BOARD_FILE_ROUTE,
                {
                    slug: boardSlug,
                },
                queryParams
            );
            const { data, error } = await get<
                ApiErrorResponse | ListBoardFilesResponse
            >(route);

            if (error !== null) {
                throw error;
            }

            return data;
        },
        queryKey: [LIST_BOARD_FILE_ROUTE, boardSlug, token],
        select,
    });

    return result;
};

export { useListBoardFiles };
