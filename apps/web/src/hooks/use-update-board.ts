import type {
    ApiErrorResponse,
    Board,
    UpdateBoardOptions,
    UpdateBoardResponse,
} from "common";
import type { ApiError } from "common/api/errors";
import { useMutation } from "@tanstack/react-query";
import { UPDATE_BOARD_ROUTE } from "common";
import { put } from "@/utils/fetch";
import { generateRoute } from "@/utils/route-utils";

type UseUpdateBoardOptions = {
    onError?: (result: ApiError) => void;
    onSuccess?: (result: Board) => void;
    slug: string;
};

const useUpdateBoard = (options: UseUpdateBoardOptions) => {
    const { onError, onSuccess, slug: originalSlug } = options ?? {};
    const result = useMutation({
        mutationFn: async (board: UpdateBoardOptions) => {
            const { token } = board;
            const route = generateRoute(
                UPDATE_BOARD_ROUTE,
                {
                    slug: originalSlug,
                },
                { token }
            );
            const { data, error } = await put<
                UpdateBoardOptions,
                ApiErrorResponse | UpdateBoardResponse
            >(route, board);

            if (error !== null) {
                throw error;
            }

            return data;
        },
        mutationKey: [UPDATE_BOARD_ROUTE],
        onError,
        onSuccess,
    });

    return result;
};

export { useUpdateBoard };
