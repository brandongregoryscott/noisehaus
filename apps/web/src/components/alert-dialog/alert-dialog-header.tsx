import { DialogHeader } from "@/components/dialog";

type AlertDialogHeaderProps = {
    children: React.ReactNode;
};

const AlertDialogHeader: React.FC<AlertDialogHeaderProps> = (props) => {
    const { children } = props;
    return <DialogHeader>{children}</DialogHeader>;
};

export type { AlertDialogHeaderProps };
export { AlertDialogHeader };
