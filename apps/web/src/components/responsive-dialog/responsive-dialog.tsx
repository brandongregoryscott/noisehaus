import { Dialog } from "@/components/dialog";
import { Drawer } from "@/components/drawer";
import { useBreakpoint } from "@/hooks/use-breakpoint";

type ResponsiveDialogProps = {
    children: React.ReactNode;
    isOpen?: boolean;
    onClose?: () => void;
};

const ResponsiveDialog: React.FC<ResponsiveDialogProps> = (props) => {
    const breakpoint = useBreakpoint();
    const { children, isOpen, onClose } = props;
    if (breakpoint === "mobile") {
        return (
            <Drawer isOpen={isOpen} onClose={onClose} position="bottom">
                {children}
            </Drawer>
        );
    }

    return (
        <Dialog isOpen={isOpen} onClose={onClose}>
            {children}
        </Dialog>
    );
};

export { ResponsiveDialog };
