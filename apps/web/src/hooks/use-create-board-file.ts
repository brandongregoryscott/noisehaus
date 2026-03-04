import type {
    ApiErrorResponse,
    ApiSuccessResponse,
    BoardFile,
    BoardToken,
} from "common";
import type { ApiError } from "common/api/errors";
import { useMutation } from "@tanstack/react-query";
import { CREATE_BOARD_FILE_ROUTE } from "common";
import { postMultipartForm } from "@/utils/fetch";
import { generateRoute } from "@/utils/route-utils";

type UseCreateBoardFileOptions = {
    boardSlug: string;
    onError?: (error: ApiError) => void;
    onSuccess?: () => void;
    token: string;
};

type CreateBoardFileOptions = {
    displayName: string;
    emoji?: string;
    file: File;
};

const useCreateBoardFile = (options: UseCreateBoardFileOptions) => {
    const { boardSlug, onError, onSuccess, token } = options ?? {};
    const result = useMutation({
        mutationFn: async (files: CreateBoardFileOptions[]) => {
            const route = generateRoute(CREATE_BOARD_FILE_ROUTE, {
                slug: boardSlug,
            });

            const formData = getFormData(files, token);
            const { data, error } = await postMultipartForm<
                ApiErrorResponse | ApiSuccessResponse<BoardFile[]>
            >(route, formData);

            if (error !== null) {
                throw error;
            }

            return data ?? [];
        },
        mutationKey: [CREATE_BOARD_FILE_ROUTE, boardSlug],
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

export type { CreateBoardFileOptions };
export { useCreateBoardFile };
