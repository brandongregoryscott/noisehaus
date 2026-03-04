import { DialogFooter } from "@/components/dialog";

type AlertDialogFooterProps = {
    children: React.ReactNode;
};

const AlertDialogFooter: React.FC<AlertDialogFooterProps> = (props) => {
    const { children } = props;
    return <DialogFooter>{children}</DialogFooter>;
};

export type { AlertDialogFooterProps };
export { AlertDialogFooter };
