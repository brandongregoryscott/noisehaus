import { AlertDialog as RadixAlertDialog } from "radix-ui";
import { DialogContent, DialogOverlay } from "@/components/dialog";

type AlertDialogProps = {
    children: React.ReactNode;
    isOpen?: boolean;
    onClose?: () => void;
};

const AlertDialog: React.FC<AlertDialogProps> = (props) => {
    const { children, isOpen, onClose } = props;
    const handleOpenChange = (open: boolean) => {
        if (open) {
            return;
        }

        onClose?.();
    };

    return (
        <RadixAlertDialog.Root onOpenChange={handleOpenChange} open={isOpen}>
            <RadixAlertDialog.Portal>
                <DialogOverlay as={RadixAlertDialog.Overlay} />
                <DialogContent as={RadixAlertDialog.Content}>
                    {children}
                </DialogContent>
            </RadixAlertDialog.Portal>
        </RadixAlertDialog.Root>
    );
};

export { AlertDialog };
