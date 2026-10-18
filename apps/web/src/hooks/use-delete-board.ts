import type { DeleteBoardOptions, Board, BoardToken, ApiError } from "common";
import { useMutation } from "@tanstack/react-query";
import { DELETE_BOARD_ROUTE } from "common";
import { _delete } from "@/utils/fetch";
import { toQueryPromise } from "@/utils/query-result";
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

            return toQueryPromise(
                _delete<DeleteBoardOptions, true>(route, { token })
            );
        },
        onError,
        onSuccess,
    });

    return result;
};

export { useDeleteBoard };
