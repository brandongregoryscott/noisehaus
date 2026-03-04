import type { CSS } from "@stitches/react";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { styled } from "@/utils/theme";

type DialogBodyProps = {
    children: React.ReactNode;
    css?: CSS;
};

const DialogBody: React.FC<DialogBodyProps> = (props) => {
    const { children, css } = props;
    const breakpoint = useBreakpoint();
    return (
        <StyledDialogBody breakpoint={breakpoint} css={css}>
            {children}
        </StyledDialogBody>
    );
};

const StyledDialogBody = styled("div", {
    display: "flex",
    flexDirection: "column",
    overflow: "auto",
    variants: {
        breakpoint: {
            desktop: {
                paddingX: 24,
            },
            mobile: {
                paddingX: 12,
            },
        },
    },
});

export type { DialogBodyProps };
export { DialogBody };
