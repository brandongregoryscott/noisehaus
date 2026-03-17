import { Dialog as RadixDialog } from "radix-ui";
import { DialogOverlay } from "@/components/dialog";
import { styled } from "@/utils/theme";

type DrawerProps = {
    children: React.ReactNode;
    isOpen?: boolean;
    onClose?: () => void;
    position?: "bottom" | "left" | "right" | "top";
};

const Drawer: React.FC<DrawerProps> = (props) => {
    const { children, isOpen, onClose, position = "right" } = props;
    const handleOpenChange = (open: boolean) => {
        if (open) {
            return;
        }

        onClose?.();
    };
    return (
        <RadixDialog.Root onOpenChange={handleOpenChange} open={isOpen}>
            <RadixDialog.Portal>
                <DialogOverlay />
                <StyledDialogContent position={position}>
                    {children}
                </StyledDialogContent>
            </RadixDialog.Portal>
        </RadixDialog.Root>
    );
};

const StyledDialogContent = styled(RadixDialog.Content, {
    backgroundColor: "$black",
    color: "$white",
    outline: "none",
    position: "fixed",
    variants: {
        position: {
            bottom: {
                borderTop: "1px solid $white",
                bottom: 0,
                maxHeight: "100vh",
                width: "100%",
            },
            left: {
                borderRight: "1px solid $white",
                height: "100%",
                left: 0,
                maxWidth: 500,
                top: 0,
            },
            right: {
                borderLeft: "1px solid $white",
                height: "100%",
                maxWidth: 500,
                right: 0,
                top: 0,
            },
            top: {
                borderBottom: "1px solid $white",
                maxHeight: "100vh",
                top: 0,
                width: "100%",
            },
        },
    },
});

export type { DrawerProps };
export { Drawer };
