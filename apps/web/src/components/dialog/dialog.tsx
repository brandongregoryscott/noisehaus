import { Dialog as RadixDialog } from "radix-ui";
import { DialogContent, DialogOverlay } from "@/components/dialog";

type DialogProps = {
    children: React.ReactNode;
    isOpen?: boolean;
    onClose?: () => void;
};

const Dialog: React.FC<DialogProps> = (props) => {
    const { children, isOpen, onClose } = props;
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
                <DialogContent>{children}</DialogContent>
            </RadixDialog.Portal>
        </RadixDialog.Root>
    );
};

export type { DialogProps };
export { Dialog };
