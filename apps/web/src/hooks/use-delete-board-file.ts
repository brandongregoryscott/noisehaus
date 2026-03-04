import type {
    ApiErrorResponse,
    Board,
    ApiError,
    DeleteBoardFileOptions,
    BoardFile,
    DeleteBoardFileResponse,
} from "common";
import { useMutation } from "@tanstack/react-query";
import { DELETE_BOARD_FILE_ROUTE } from "common";
import { _delete } from "@/utils/fetch";
import { generateRoute } from "@/utils/route-utils";

type UseDeleteBoardFileOptions = {
    onError?: (error: ApiError) => void;
    onSuccess?: () => void;
};

const useDeleteBoardFile = (options?: UseDeleteBoardFileOptions) => {
    const { onError, onSuccess } = options ?? {};
    const result = useMutation({
        mutationFn: async (
            options: DeleteBoardFileOptions &
                Pick<Board, "slug"> &
                Pick<BoardFile, "id">
        ) => {
            const { id, slug, token } = options;
            const route = generateRoute(DELETE_BOARD_FILE_ROUTE, { id, slug });

            const { data, error } = await _delete<
                DeleteBoardFileOptions,
                ApiErrorResponse | DeleteBoardFileResponse
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

export { useDeleteBoardFile };
