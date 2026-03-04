import type {
    DeleteBoardOptions,
    ApiErrorResponse,
    DeleteBoardResponse,
    Board,
    BoardToken,
    ApiError,
} from "common";
import { useMutation } from "@tanstack/react-query";
import { DELETE_BOARD_ROUTE } from "common";
import { _delete } from "@/utils/fetch";
import { generateRoute } from "@/utils/route-utils";

type UseDeleteBoardOptions = {
    onError?: (error: ApiError) => void;
    onSuccess?: () => void;
};

const useDeleteBoard = (options?: UseDeleteBoardOptions) => {
    const { onError, onSuccess } = options ?? {};
    const result = useMutation({
        mutationFn: async (
            options: Pick<Board, "slug"> & Pick<BoardToken, "token">
        ) => {
            const { slug, token } = options;
            const route = generateRoute(DELETE_BOARD_ROUTE, { slug });

            const { data, error } = await _delete<
                DeleteBoardOptions,
                ApiErrorResponse | DeleteBoardResponse
            >(route, { token });

            if (error !== null) {
                throw error;
            }

            return data;
        },
        onError,
        onSuccess,
    });

    return result;
};

export { useDeleteBoard };
