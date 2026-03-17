import type { PropsWithChildren } from "react";
import { Toast as RadixToast } from "radix-ui";
import { useMemo, useState } from "react";
import type { ToastContextState, ToastInstance } from "@/hooks/use-toast";
import type { PropsOf } from "@/types/props-of";
import { Button } from "@/components/button";
import { Column } from "@/components/column";
import { Icon } from "@/components/icon";
import { Row } from "@/components/row";
import { Text } from "@/components/text";
import { ToastContext, useToast } from "@/hooks/use-toast";
import { styled } from "@/utils/theme";

const Toast: typeof RadixToast = { ...RadixToast };

const ToastProvider: React.FC<PropsOf<typeof RadixToast.Provider>> = (
    props
) => {
    const { children, ...rest } = props;
    const { closeToast, toasts } = useToast();
    return (
        <RadixToast.Provider {...rest} duration={0}>
            {toasts.map((toast) => (
                <Toast.Root asChild={true} key={toast.id} type="background">
                    <StyledToastRoot colorType={toast.colorType}>
                        <Toast.Description>
                            <Row
                                css={{
                                    justifyContent: "space-between",
                                    width: "100%",
                                }}>
                                <Column>
                                    {toast.title != null && (
                                        <Text fontWeight="bold">
                                            {toast.title}
                                        </Text>
                                    )}
                                    <Text>{toast.description}</Text>
                                </Column>
                                <Button
                                    css={{
                                        "& svg": {
                                            height: 16,
                                            width: 16,
                                        },
                                        borderRadius: 4,
                                        height: 20,
                                        padding: 0,
                                        width: 20,
                                    }}
                                    fillStyle="Ghost"
                                    onClick={() => closeToast(toast.id)}>
                                    <Icon
                                        color={
                                            toast.colorType === "Constructive"
                                                ? "$white"
                                                : "$black"
                                        }
                                        name="X"
                                    />
                                </Button>
                            </Row>
                        </Toast.Description>
                    </StyledToastRoot>
                </Toast.Root>
            ))}
            {children}
            <RadixToast.Viewport asChild={true}>
                <StyledToastViewport />
            </RadixToast.Viewport>
        </RadixToast.Provider>
    );
};

Toast.Provider = ToastProvider;

const StyledToastRoot = styled("div", {
    alignItems: "center",
    borderRadius: 8,
    display: "flex",
    gap: 8,
    maxWidth: 320,
    paddingX: 16,
    paddingY: 8,
    variants: {
        colorType: {
            Constructive: {
                backgroundColor: "$positive",
                color: "$white",
            },
            Destructive: {
                backgroundColor: "$danger",
                color: "$black",
            },
        },
    },
});

const StyledToastViewport = styled("div", {
    alignItems: "flex-end",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    position: "fixed",
    right: 8,
    top: 8,
    zIndex: "$toast",
});

const ToastContextProvider: React.FC<PropsWithChildren> = (props) => {
    const { children } = props;
    const [toasts, setToasts] = useState<ToastInstance[]>([]);
    const value = useMemo(
        (): ToastContextState => ({
            setToasts,
            toasts,
        }),
        [toasts]
    );

    return (
        <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
    );
};

export { Toast, ToastContextProvider };
