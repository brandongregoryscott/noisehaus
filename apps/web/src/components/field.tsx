import { Box } from "@/components/box";

type FieldProps = {
    children?: React.ReactNode;
    description?: string;
    fullWidth?: boolean;
    label?: string;
};

const Field: React.FC<FieldProps> = (props) => {
    const { children, description, fullWidth, label } = props;
    return (
        <Box
            css={{
                display: "flex",
                flexDirection: "column",
                rowGap: 12,
                width: fullWidth === true ? "100%" : undefined,
            }}>
            {label != null && (
                <Box as="span" css={{ fontWeight: "bold" }}>
                    {label}
                </Box>
            )}
            {description != null && <Box as="span">{description}</Box>}
            {children}
        </Box>
    );
};

export { Field };
