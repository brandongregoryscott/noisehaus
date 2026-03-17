import React from "react";
import type { ColorToken } from "@/utils/theme";
import { Box } from "@/components/box";

type TextProps = {
    as?: "code" | "p" | "span";
    children: React.ReactNode;
    color?: ColorToken;
    fontSize?: number;
    fontWeight?: "bold";
    textAlign?: "center" | "left" | "right";
};

const Text: React.FC<TextProps> = (props) => {
    const {
        as = "span",
        children,
        color,
        fontSize,
        fontWeight,
        textAlign,
    } = props;

    return (
        <Box as={as} css={{ color, fontSize, fontWeight, textAlign }}>
            {children}
        </Box>
    );
};

export { Text };
