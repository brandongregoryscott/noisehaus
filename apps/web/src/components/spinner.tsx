import { keyframes, styled } from "@/utils/theme";

type SpinnerProps = {
    size?: "Default" | "Small";
};

const Spinner: React.FC<SpinnerProps> = (props) => {
    const { size = "Default" } = props;
    return <StyledSpinner size={size} />;
};

const spin = keyframes({
    "0%": { transform: "rotate(0deg)" },
    "100%": { transform: "rotate(360deg)" },
});

const StyledSpinner = styled(
    "div",
    {
        animation: `${spin} 500ms linear infinite`,
        borderBottomColor: "transparent",
        borderColor: "currentColor",
        borderInlineStartColor: "transparent",
        borderRadius: "100%",
        borderStyle: "solid",
        borderWidth: 2,
        display: "inline-block",
    },
    {
        variants: {
            size: {
                Default: {
                    height: 24,
                    width: 24,
                },
                Small: {
                    height: 16,
                    width: 16,
                },
            },
        },
    }
);

export { Spinner };
