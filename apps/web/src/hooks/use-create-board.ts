import type {
    ApiError,
    BoardFile,
    CreateBoardOptions,
    CreateBoardResult,
} from "common";
import { useMutation } from "@tanstack/react-query";
import { CREATE_BOARD_FILE_ROUTE, CREATE_BOARD_ROUTE, ErrorName } from "common";
import { isEmpty } from "lodash-es";
import type { CreateBoardFileOptions } from "@/hooks/use-create-board-file";
import { post, postMultipartForm } from "@/utils/fetch";
import { toQueryPromise } from "@/utils/query-result";
import { generateRoute } from "@/utils/route-utils";

type CreateBoardMutationOptions = {
    files?: CreateBoardFileOptions[];
} & CreateBoardOptions;

type CreateBoardMutationResult = {
    data: CreateBoardResult;
    error: ApiError | null;
};

type UseCreateBoardOptions = {
    onError?: (error: ApiError) => void;
    onSuccess?: (response: CreateBoardMutationResult) => void;
};

const unconfirmedUploadError: ApiError = {
    message:
        "Your board was created, but the upload could not be confirmed. Check its sounds before uploading again.",
    name: ErrorName.ERROR_UNHANDLED,
};

const useCreateBoard = (options?: UseCreateBoardOptions) => {
    const { onError, onSuccess } = options ?? {};
    return useMutation<
        CreateBoardMutationResult,
        ApiError,
        CreateBoardMutationOptions
    >({
        mutationFn: async (options) => {
            const { files, ...board } = options;
            const createdBoard = await toQueryPromise(
                post<CreateBoardOptions, CreateBoardResult>(
                    CREATE_BOARD_ROUTE,
                    board
                )
            );

            if (files === undefined || isEmpty(files)) {
                return { data: createdBoard, error: null };
            }

            // Once creation succeeds, every upload outcome must retain the board/token.
            // A lost response is ambiguous: inspect the board rather than auto-retrying.
            try {
                const formData = getFormData(files, createdBoard.token);
                const route = generateRoute(CREATE_BOARD_FILE_ROUTE, {
                    slug: createdBoard.slug,
                });
                const upload = await postMultipartForm<BoardFile[]>(
                    route,
                    formData
                );
                if (upload.isOk) {
                    return { data: createdBoard, error: null };
                }
                const uploadError =
                    upload.error.name === ErrorName.ERROR_UNHANDLED
                        ? unconfirmedUploadError
                        : upload.error;
                return { data: createdBoard, error: uploadError };
            } catch {
                return {
                    data: createdBoard,
                    error: unconfirmedUploadError,
                };
            }
        },
        mutationKey: [CREATE_BOARD_ROUTE],
        onError,
        onSuccess,
    });
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

export type { CreateBoardMutationResult };
export { useCreateBoard };
