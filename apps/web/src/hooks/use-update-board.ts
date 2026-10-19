import type { Board, UpdateBoardOptions } from "common";
import type { ApiError } from "common/api/errors";
import { useMutation } from "@tanstack/react-query";
import { UPDATE_BOARD_ROUTE } from "common";
import { put } from "@/utils/fetch";
import { toQueryPromise } from "@/utils/query-result";
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
            return toQueryPromise(put<UpdateBoardOptions, Board>(route, board));
        },
        mutationKey: [UPDATE_BOARD_ROUTE],
        onError,
        onSuccess,
    });

    return result;
};

export { useUpdateBoard };
