import type {
    ApiErrorResponse,
    CreateBoardOptions,
    CreateBoardResult,
    ApiSuccessResponse,
    BoardFile,
} from "common";
import type { ApiError } from "common/api/errors";
import { useMutation } from "@tanstack/react-query";
import { CREATE_BOARD_FILE_ROUTE, CREATE_BOARD_ROUTE } from "common";
import { isEmpty } from "lodash-es";
import type { CreateBoardFileOptions } from "@/hooks/use-create-board-file";
import { post, postMultipartForm } from "@/utils/fetch";
import { generateRoute } from "@/utils/route-utils";

type UseCreateBoardOptions = {
    onError?: (error: ApiError) => void;
    onSuccess?: (response: CreateBoardMutationResult) => void;
};

type CreateBoardMutationResult = {
    data: CreateBoardResult;
    error: ApiError | null;
};

const useCreateBoard = (options?: UseCreateBoardOptions) => {
    const { onError, onSuccess } = options ?? {};
    const result = useMutation<
        CreateBoardMutationResult,
        ApiError,
        { files?: CreateBoardFileOptions[] } & CreateBoardOptions
    >({
        mutationFn: async (
            options: { files?: CreateBoardFileOptions[] } & CreateBoardOptions
        ) => {
            const { files, ...board } = options;

            const { data: createdBoard, error } = await post<
                CreateBoardOptions,
                ApiErrorResponse | ApiSuccessResponse<CreateBoardResult>
            >(CREATE_BOARD_ROUTE, board);

            if (error !== null) {
                throw error;
            }

            const { token } = createdBoard;
            if (files !== undefined && !isEmpty(files)) {
                const route = generateRoute(CREATE_BOARD_FILE_ROUTE, {
                    slug: createdBoard.slug,
                });

                const formData = getFormData(files, token);
                const { error: boardFilesError } = await postMultipartForm<
                    ApiErrorResponse | ApiSuccessResponse<BoardFile[]>
                >(route, formData);

                return { data: createdBoard, error: boardFilesError };
            }

            return { data: createdBoard, error: null };
        },
        mutationKey: [CREATE_BOARD_ROUTE],
        onError,
        onSuccess,
    });

    return result;
};

const getFormData = (
    files: CreateBoardFileOptions[],
    token: string
): FormData => {
    const formData = new FormData();
    files.forEach((fileOptions) => {
        const { displayName, emoji, file } = fileOptions;
        if (file === undefined) {
            return;
        }

        formData.append("files", file);
        formData.append("emojis", emoji ?? "null");
        formData.append("displayNames", displayName);
    });

    formData.set("token", token);
    return formData;
};

export { useCreateBoard };
export type { CreateBoardMutationResult };
