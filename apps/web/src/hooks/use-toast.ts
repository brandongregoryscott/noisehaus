import type { Dispatch, SetStateAction } from "react";
import { isNumber, noop, uniqueId } from "lodash-es";
import { createContext, useCallback, useContext } from "react";

type ToastInstance = {
    id: string;
} & ToastOptions;

type ToastOptions = {
    colorType: "Constructive" | "Destructive";
    description: string;
    durationInMs?: "persistent" | number;
    title?: string;
};

type ToastContextState = {
    setToasts: Dispatch<SetStateAction<ToastInstance[]>>;
    toasts: ToastInstance[];
};

const ToastContext = createContext<ToastContextState>({
    setToasts: noop,
    toasts: [],
});

const DEFAULT_DURATION_IN_MS = 5000;

const useToast = () => {
    const { setToasts, toasts } = useContext(ToastContext);
    const closeToast = useCallback(
        (id: string) => {
            setToasts((prevToasts) =>
                prevToasts.filter((toast) => toast.id !== id)
            );
        },
        [setToasts]
    );

    const openConstructive = useCallback(
        (options: Omit<ToastOptions, "colorType">) => {
            const {
                description,
                durationInMs = DEFAULT_DURATION_IN_MS,
                title,
            } = options;
            const toast: ToastInstance = {
                colorType: "Constructive",
                description,
                durationInMs,
                id: uniqueId(),
                title,
            };

            setToasts((prevToasts) => [...prevToasts, toast]);

            if (isNumber(durationInMs)) {
                setTimeout(() => {
                    closeToast(toast.id);
                }, durationInMs);
            }

            return toast;
        },
        [closeToast, setToasts]
    );

    const openDestructive = useCallback(
        (options: Omit<ToastOptions, "colorType" | "durationInMs">) => {
            const { description, title } = options;
            const toast: ToastInstance = {
                colorType: "Destructive",
                description,
                durationInMs: "persistent",
                id: uniqueId(),
                title,
            };

            setToasts((prevToasts) => [...prevToasts, toast]);

            return toast;
        },
        [setToasts]
    );

    return {
        closeToast,
        openConstructive,
        openDestructive,
        toasts,
    };
};

export { ToastContext, useToast };
export type { ToastContextState, ToastInstance, ToastOptions };
