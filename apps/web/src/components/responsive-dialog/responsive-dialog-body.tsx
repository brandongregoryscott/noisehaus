import type { CSS } from "@stitches/react";
import { DialogBody } from "@/components/dialog";
import { DrawerBody } from "@/components/drawer";
import { useBreakpoint } from "@/hooks/use-breakpoint";

type ResponsiveDialogBodyProps = {
    children: React.ReactNode;
    css?: CSS;
};

const ResponsiveDialogBody: React.FC<ResponsiveDialogBodyProps> = (props) => {
    const { children, css } = props;
    const breakpoint = useBreakpoint();

    if (breakpoint === "mobile") {
        return <DrawerBody css={css}>{children}</DrawerBody>;
    }

    return <DialogBody css={css}>{children}</DialogBody>;
};

export { ResponsiveDialogBody };
