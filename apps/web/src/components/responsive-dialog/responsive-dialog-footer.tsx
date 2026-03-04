import { DialogFooter } from "@/components/dialog";
import { DrawerFooter } from "@/components/drawer";
import { useBreakpoint } from "@/hooks/use-breakpoint";

type ResponsiveDialogFooterProps = {
    children: React.ReactNode;
};

const ResponsiveDialogFooter: React.FC<ResponsiveDialogFooterProps> = (
    props
) => {
    const { children } = props;
    const breakpoint = useBreakpoint();

    if (breakpoint === "mobile") {
        return <DrawerFooter>{children}</DrawerFooter>;
    }

    return <DialogFooter>{children}</DialogFooter>;
};

export { ResponsiveDialogFooter };
