import { Box } from "@/components/box";
import { styled } from "@/utils/theme";

type AlertProps = {
    colorType?: "Destructive" | "Neutral";
    description?: React.ReactNode;
    icon?: React.ReactNode;
    title?: React.ReactNode;
};

const Alert: React.FC<AlertProps> = (props) => {
    const { colorType = "Neutral", description, icon, title } = props;
    return (
        <StyledAlert colorType={colorType}>
            {icon}
            <Box css={{ fontWeight: "bold" }}>{title}</Box>
            {description}
        </StyledAlert>
    );
};

const StyledAlert = styled("div", {
    alignItems: "center",
    borderRadius: 8,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    justifyContent: "center",
    padding: 24,
    textAlign: "center",
    variants: {
        colorType: {
            Destructive: {
                background: "$danger",
            },
            Neutral: {
                "& svg": {
                    fill: "$white",
                },
                background: "$black",
            },
        },
    },
});

export { Alert };
