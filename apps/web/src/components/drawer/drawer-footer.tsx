import { DialogFooter } from "@/components/dialog";

type DrawerFooterProps = {
    children: React.ReactNode;
};

const DrawerFooter: React.FC<DrawerFooterProps> = (props) => {
    const { children } = props;
    return <DialogFooter>{children}</DialogFooter>;
};

export type { DrawerFooterProps };
export { DrawerFooter };
