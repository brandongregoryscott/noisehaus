import type { CSS } from "@stitches/react";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { styled } from "@/utils/theme";

type DrawerBodyProps = {
    children: React.ReactNode;
    css?: CSS;
};

const DrawerBody: React.FC<DrawerBodyProps> = (props) => {
    const { children, css } = props;
    const breakpoint = useBreakpoint();
    return (
        <StyledDrawerBody breakpoint={breakpoint} css={css}>
            {children}
        </StyledDrawerBody>
    );
};

const StyledDrawerBody = styled("div", {
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

export type { DrawerBodyProps };
export { DrawerBody };
