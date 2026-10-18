import type { ApiError } from "common";
import { useMutation } from "@tanstack/react-query";
import { CREATE_BOARD_ROUTE } from "common";
import type {
    CreateBoardMutationOptions,
    CreateBoardMutationResult,
} from "@/boards/create-board";
import { createBoard } from "@/boards/create-board";

type UseCreateBoardOptions = {
    onError?: (error: ApiError) => void;
    onSuccess?: (response: CreateBoardMutationResult) => void;
};

const useCreateBoard = (options?: UseCreateBoardOptions) => {
    const { onError, onSuccess } = options ?? {};
    return useMutation<
        CreateBoardMutationResult,
        ApiError,
        CreateBoardMutationOptions
    >({
        mutationFn: createBoard,
        mutationKey: [CREATE_BOARD_ROUTE],
        onError,
        onSuccess,
    });
};

export type { CreateBoardMutationResult };
export { useCreateBoard };
