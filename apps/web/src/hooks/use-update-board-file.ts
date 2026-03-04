import type {
    ApiErrorResponse,
    BoardFile,
    UpdateBoardFileOptions,
    UpdateBoardFileResponse,
} from "common";
import type { ApiError } from "common/api/errors";
import { useMutation } from "@tanstack/react-query";
import { UPDATE_BOARD_FILE_ROUTE } from "common";
import { putMultipartForm } from "@/utils/fetch";
import { generateRoute } from "@/utils/route-utils";

type UseUpdateBoardOptions = {
    boardSlug: string;
    id: string;
    onError?: (result: ApiError) => void;
    onSuccess?: (result: BoardFile) => void;
};

const useUpdateBoardFile = (options: UseUpdateBoardOptions) => {
    const { boardSlug, id, onError, onSuccess } = options ?? {};
    const result = useMutation({
        mutationFn: async (options: UpdateBoardFileOptions) => {
            const route = generateRoute(UPDATE_BOARD_FILE_ROUTE, {
                id,
                slug: boardSlug,
            });

            const formData = getFormData(options);
            const { data, error } = await putMultipartForm<
                ApiErrorResponse | UpdateBoardFileResponse
            >(route, formData);

            if (error !== null) {
                throw error;
            }

            return data;
        },
        mutationKey: [UPDATE_BOARD_FILE_ROUTE],
        onError,
        onSuccess,
    });

    return result;
};

const getFormData = (options: UpdateBoardFileOptions): FormData => {
    const formData = new FormData();

    const { displayName, emoji, file, token } = options;

    // File is a placeholder object unless the user has chosen to modify it
    if (file !== undefined && file.size > 0) {
        formData.set("file", file);
    }

    formData.set("emoji", emoji ?? "null");

    if (displayName !== undefined) {
        formData.set("displayName", displayName);
    }

    formData.set("token", token);
    return formData;
};

export { useUpdateBoardFile };
