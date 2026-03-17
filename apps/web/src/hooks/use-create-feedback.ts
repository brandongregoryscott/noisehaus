import type {
    ApiErrorResponse,
    CreateFeedbackOptions,
    CreateFeedbackResponse,
    Feedback,
} from "common";
import type { ApiError } from "common/api/errors";
import { useMutation } from "@tanstack/react-query";
import { CREATE_FEEDBACK_ROUTE } from "common";
import { post } from "@/utils/fetch";
import { generateRoute } from "@/utils/route-utils";

type UseCreateFeedbackOptions = {
    onError?: (result: ApiError) => void;
    onSuccess?: (result: Feedback) => void;
};

const useCreateFeedback = (options: UseCreateFeedbackOptions) => {
    const { onError, onSuccess } = options ?? {};
    const result = useMutation({
        mutationFn: async (options: CreateFeedbackOptions) => {
            const route = generateRoute(CREATE_FEEDBACK_ROUTE, {});
            const { data, error } = await post<
                CreateFeedbackOptions,
                ApiErrorResponse | CreateFeedbackResponse
            >(route, options);

            if (error !== null) {
                throw error;
            }

            return data;
        },
        mutationKey: [CREATE_FEEDBACK_ROUTE],
        onError,
        onSuccess,
    });

    return result;
};

export { useCreateFeedback };
