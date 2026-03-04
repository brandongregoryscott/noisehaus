import { useBreakpoint } from "@/hooks/use-breakpoint";
import { styled } from "@/utils/theme";

type DialogHeaderProps = {
    children: React.ReactNode;
};

const DialogHeader: React.FC<DialogHeaderProps> = (props) => {
    const { children } = props;
    const breakpoint = useBreakpoint();
    return (
        <StyledDialogHeader breakpoint={breakpoint}>
            {children}
        </StyledDialogHeader>
    );
};

const StyledDialogHeader = styled("div", {
    backgroundColor: "$black",
    display: "flex",
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

export type { DialogHeaderProps };
export { DialogHeader };
