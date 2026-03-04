import type { LinkProps } from "@tanstack/react-router";
import { Link as TanstackLink } from "@tanstack/react-router";
import React from "react";
import { Box } from "@/components/box";

const Link: React.FC<LinkProps> = (props) => {
    const { children, ...rest } = props;
    return (
        <Box
            css={{
                "&:focus-within": {
                    focusRing: "$white",
                },
            }}>
            <TanstackLink {...rest} style={{ outline: "none" }}>
                {children as React.ReactNode}
            </TanstackLink>
        </Box>
    );
};

export { Link };
