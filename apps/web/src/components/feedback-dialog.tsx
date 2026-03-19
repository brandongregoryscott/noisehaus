import type { ApiError } from "common";
import { first } from "lodash-es";
import React, { useMemo } from "react";
import { Button } from "@/components/button";
import { Field } from "@/components/field";
import { Heading } from "@/components/heading";
import { Input } from "@/components/input";
import {
    ResponsiveDialog,
    ResponsiveDialogBody,
    ResponsiveDialogFooter,
    ResponsiveDialogHeader,
} from "@/components/responsive-dialog";
import { Textarea } from "@/components/textarea";
import { useFeedback } from "@/hooks/use-feedback";
import { useToast } from "@/hooks/use-toast";
import { randomItem } from "@/utils/core-utils";

type FeedbackDialogProps = {
    boardSlug?: string;
    isOpen: boolean;
    onClose: () => void;
};

const PLACEHOLDERS = [
    "Can you make the background sky blue?",
    "All sounds should play twice as loud.",
];

const FeedbackDialog: React.FC<FeedbackDialogProps> = (props) => {
    const { boardSlug, isOpen, onClose } = props;
    const { openConstructive, openDestructive } = useToast();
    const handleError = (error: ApiError) => {
        openDestructive({
            description: error.message,
            title: "Error submitting feedback",
        });
    };

    const handleSuccess = () => {
        openConstructive({
            description: "If you provided your email, we'll be in touch.",
            title: "Feedback received!",
        });
        onClose();
    };

    const {
        comment,
        email,
        errors,
        handleEmailChange,
        handleEmailClear,
        handleFeedbackChange,
        handleFeedbackClear,
        handleSave,
        isPending,
    } = useFeedback({
        boardSlug,
        onError: handleError,
        onSuccess: handleSuccess,
    });
    // This is only memoized so it doesn't regenerate while this instance is open, but we do want
    // it to periodically change if the user opens/closes the dialog multiple times in a session
    const placeholder = useMemo(() => randomItem(PLACEHOLDERS), []);
    return (
        <ResponsiveDialog isOpen={isOpen} onClose={onClose}>
            <ResponsiveDialogHeader>
                <Heading size="h3">Feedback</Heading>
            </ResponsiveDialogHeader>
            <ResponsiveDialogBody css={{ gap: 24 }}>
                <span>
                    Feel free to submit any feedback you have for the site.
                    Feature requests, bugs, or just a note about how you're
                    using it, we'll read everything that comes through and get
                    back to you if you leave your email address.
                </span>
                <Field fullWidth={true} label="Board Name">
                    <Input
                        errorMessage={first(errors.email)}
                        onChange={handleEmailChange}
                        onClear={handleEmailClear}
                        placeholder="Email address"
                        showClearAffordance={true}
                        value={email}
                        width="100%"
                    />
                </Field>
                <Field fullWidth={true} label="Comment">
                    <Textarea
                        errorMessage={first(errors.comment)}
                        onChange={handleFeedbackChange}
                        onClear={handleFeedbackClear}
                        placeholder={placeholder}
                        showClearAffordance={true}
                        value={comment}
                        width="100%"
                    />
                </Field>
            </ResponsiveDialogBody>
            <ResponsiveDialogFooter>
                <Button fillStyle="Ghost" onClick={onClose}>
                    Cancel
                </Button>
                <Button isLoading={isPending} onClick={handleSave}>
                    Submit
                </Button>
            </ResponsiveDialogFooter>
        </ResponsiveDialog>
    );
};

export { FeedbackDialog };
