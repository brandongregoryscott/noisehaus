import React from "react";
import type { ColorToken } from "@/utils/theme";
import { Box } from "@/components/box";

type TextProps = {
    as?: "code" | "p" | "span";
    children: React.ReactNode;
    color?: ColorToken;
    fontWeight?: "bold";
    textAlign?: "center" | "left" | "right";
};

const Text: React.FC<TextProps> = (props) => {
    const { as = "span", children, color, fontWeight, textAlign } = props;

    return (
        <Box as={as} css={{ color, fontWeight, textAlign }}>
            {children}
        </Box>
    );
};

export { Text };
