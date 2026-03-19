import type { ApiError, Feedback } from "common";
import type { FormEvent } from "react";
import { useState } from "react";
import type { FieldErrors } from "@/utils/validation";
import { useCreateFeedback } from "@/hooks/use-create-feedback";
import { getFieldErrors, validate } from "@/utils/validation";
import { feedbackFormValidator } from "@/utils/validators/feedback-validators";

type UseFeedbackOptions = {
    boardSlug?: string;
    onError?: (error: ApiError) => void;
    onSuccess?: (feedback: Feedback) => void;
};

const useFeedback = (options?: UseFeedbackOptions) => {
    const { boardSlug, onError, onSuccess } = options ?? {};
    const [feedback, setFeedback] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [errors, setErrors] = useState<
        FieldErrors<{ email?: string; feedback: string }>
    >({});

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
        const result = validate(feedbackFormValidator, { email, feedback });
        const errors = getFieldErrors(result);
        setErrors(errors);

        if (!result.success) {
            return;
        }

        createFeedback({
            board_slug: boardSlug,
            email: result.data.email,
            feedback: result.data.feedback,
        });
    };

    return {
        email,
        errors,
        feedback,
        handleEmailChange,
        handleEmailClear,
        handleFeedbackChange,
        handleFeedbackClear,
        handleSave,
        isPending,
    };
};

export { useFeedback };
