import type { ApiError, Feedback } from "common";
import type { FormEvent } from "react";
import { isEmpty } from "lodash-es";
import { useState } from "react";
import { useCreateFeedback } from "@/hooks/use-create-feedback";
import { validate } from "@/utils/validation";
import {
    emailValidator,
    feedbackValidator,
} from "@/utils/validators/feedback-validators";

type UseFeedbackOptions = {
    boardSlug?: string;
    onError?: (error: ApiError) => void;
    onSuccess?: (feedback: Feedback) => void;
};

const useFeedback = (options?: UseFeedbackOptions) => {
    const { boardSlug, onError, onSuccess } = options ?? {};
    const [feedback, setFeedback] = useState<string>("");
    const [feedbackErrorMessage, setFeedbackErrorMessage] = useState<
        string | undefined
    >(undefined);
    const [email, setEmail] = useState<string | undefined>(undefined);
    const [emailErrorMessage, setEmailErrorMessage] = useState<
        string | undefined
    >(undefined);
    const { isPending, mutate: createFeedback } = useCreateFeedback({
        onError,
        onSuccess,
    });

    const handleEmailClear = () => setEmail("");
    const handleEmailChange = async (event: FormEvent<HTMLInputElement>) => {
        const email = (event.target as HTMLInputElement).value;
        setEmail(email);
    };

    const handleFeedbackClear = () => setFeedback("");
    const handleFeedbackChange = async (
        event: FormEvent<HTMLTextAreaElement>
    ) => {
        const feedback = (event.target as HTMLTextAreaElement).value;
        setFeedback(feedback);
    };

    const handleSave = async () => {
        const feedbackValidationState = validate(feedbackValidator, feedback);
        setFeedbackErrorMessage(feedbackValidationState?.firstError);
        const emailValidationState = validate(emailValidator, email);
        if (!isEmpty(email)) {
            setEmailErrorMessage(emailValidationState?.firstError);
        }

        if (
            feedbackValidationState != null ||
            (!isEmpty(email) && emailValidationState != null)
        ) {
            return;
        }

        createFeedback({ board_slug: boardSlug, email, feedback });
    };

    return {
        email,
        emailErrorMessage,
        feedback,
        feedbackErrorMessage,
        handleEmailChange,
        handleEmailClear,
        handleFeedbackChange,
        handleFeedbackClear,
        handleSave,
        isPending,
    };
};

export { useFeedback };
