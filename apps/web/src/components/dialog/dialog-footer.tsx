import { useBreakpoint } from "@/hooks/use-breakpoint";
import { styled } from "@/utils/theme";

type DialogFooterProps = {
    children: React.ReactNode;
};

const DialogFooter: React.FC<DialogFooterProps> = (props) => {
    const { children } = props;
    const breakpoint = useBreakpoint();
    return (
        <StyledDialogFooter breakpoint={breakpoint}>
            {children}
        </StyledDialogFooter>
    );
};

const StyledDialogFooter = styled("div", {
    backgroundColor: "$black",
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
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

export type { DialogFooterProps };
export { DialogFooter };
