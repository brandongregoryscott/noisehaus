import type { CSS } from "@stitches/react";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { styled } from "@/utils/theme";

type AlertDialogBodyProps = {
    children: React.ReactNode;
    css?: CSS;
};

const AlertDialogBody: React.FC<AlertDialogBodyProps> = (props) => {
    const { children, css } = props;
    const breakpoint = useBreakpoint();
    return (
        <StyledAlertDialogBody breakpoint={breakpoint} css={css}>
            {children}
        </StyledAlertDialogBody>
    );
};

const StyledAlertDialogBody = styled("div", {
    display: "flex",
    flexDirection: "column",
    overflow: "auto",
    variants: {
        breakpoint: {
            desktop: {
                padding: 24,
            },
            mobile: {
                padding: 12,
            },
        },
    },
});

export type { AlertDialogBodyProps };
export { AlertDialogBody };
