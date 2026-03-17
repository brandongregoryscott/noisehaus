import type { CSS } from "@stitches/react";
import type { LinkProps as TanstackLinkProps } from "@tanstack/react-router";
import type { PropsWithChildren } from "react";
import { Link as TanstackLink } from "@tanstack/react-router";
import React, { forwardRef } from "react";
import { styled } from "@/utils/theme";

type LinkProps = {
    css?: CSS;
    onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
} & (Pick<HTMLAnchorElement, "href"> | Pick<TanstackLinkProps, "to">) &
    PropsWithChildren;

const Link = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
    const { children, ...rest } = props;
    const isExternal = "href" in props;

    return (
        <StyledLink
            as={isExternal ? "a" : undefined}
            ref={ref}
            target={isExternal ? "_blank" : undefined}
            {...rest}>
            {children}
        </StyledLink>
    );
});

Link.displayName = "Link";

const StyledLink = styled(TanstackLink, {
    "&:focus-within": {
        focusRing: "$white",
    },
    alignItems: "center",
    display: "flex",
    gap: 4,
    outline: "none",
});

export { Link };
