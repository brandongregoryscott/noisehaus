import { DialogHeader } from "@/components/dialog";
import { DrawerHeader } from "@/components/drawer";
import { useBreakpoint } from "@/hooks/use-breakpoint";

type ResponsiveDialogHeaderProps = {
    children: React.ReactNode;
};

const ResponsiveDialogHeader: React.FC<ResponsiveDialogHeaderProps> = (
    props
) => {
    const { children } = props;
    const breakpoint = useBreakpoint();

    if (breakpoint === "mobile") {
        return <DrawerHeader>{children}</DrawerHeader>;
    }

    return <DialogHeader>{children}</DialogHeader>;
};

export { ResponsiveDialogHeader };
