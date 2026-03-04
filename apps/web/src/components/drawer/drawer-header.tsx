import { DialogHeader } from "@/components/dialog";

type DrawerHeaderProps = {
    children: React.ReactNode;
};

const DrawerHeader: React.FC<DrawerHeaderProps> = (props) => {
    const { children } = props;
    return <DialogHeader>{children}</DialogHeader>;
};

export type { DrawerHeaderProps };
export { DrawerHeader };
