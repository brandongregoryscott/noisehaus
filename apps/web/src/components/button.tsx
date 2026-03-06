import type { CSS } from "@stitches/react";
import type { PropsWithChildren } from "react";
import React, { forwardRef } from "react";
import { Icon } from "@/components/icon";
import { Spinner } from "@/components/spinner";
import { styled } from "@/utils/theme";

type ButtonProps = {
    align?: "center" | "left" | "right";
    as?: keyof JSX.IntrinsicElements;
    autoFocus?: boolean;
    colorType?: "Destructive" | "Neutral";
    /**
     * Override CSS object. Use sparingly.
     */
    css?: CSS;
    disabled?: boolean;
    fillStyle?: "Ghost" | "Outline" | "Solid";
    isLoading?: boolean;
    maxWidth?: `${number}%` | number;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    size?: "Default" | "Small";
    slot?: string;
    width?: `${number}%` | number;
} & PropsWithChildren;

const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
    const {
        align = "center",
        as,
        autoFocus,
        children,
        colorType = "Neutral",
        css,
        fillStyle = "Solid",
        isLoading = false,
        maxWidth,
        onClick,
        size = "Default",
        slot,
        width,
    } = props;

    const disabled = props.disabled ?? isLoading;

    const iconOnly =
        React.Children.count(children) === 1 &&
        (children as React.ReactElement).type === Icon;

    return (
        <StyledButton
            _disabled={disabled}
            align={align}
            as={as}
            autoFocus={autoFocus}
            colorType={colorType}
            css={{ maxWidth, width, ...css }}
            // This is for the native `disabled` attribute
            disabled={disabled}
            fillStyle={fillStyle}
            iconOnly={iconOnly}
            onClick={onClick}
            ref={ref}
            role={as != null ? "button" : undefined}
            size={size}
            slot={slot}
            tabIndex={as != null ? 0 : undefined}>
            {isLoading && <Spinner size="Small" />}
            {children}
        </StyledButton>
    );
});

const StyledButton = styled("button", {
    alignItems: "center",
    appearance: "none",
    border: "none",
    borderRadius: 8,
    compoundVariants: [
        {
            colorType: "Neutral",
            css: {
                "&:focus-visible": {
                    focusRing: "$white",
                },
                "&:hover": {
                    backgroundColor: "$gray",
                },
                "& .spinner": {
                    borderBottomColor: "transparent",
                    borderColor: "$black",
                    borderInlineStartColor: "transparent",
                },
                "& span": {
                    color: "$black",
                },
                "& svg": {
                    fill: "$black",
                },
                backgroundColor: "$white",
                color: "$black",
            },
            fillStyle: "Solid",
        },
        {
            colorType: "Neutral",
            css: {
                "&:focus-visible": {
                    focusRing: "$white",
                },
                "&:hover": {
                    "& span": {
                        color: "$black",
                    },
                    "& svg": {
                        fill: "$black",
                    },
                    backgroundColor: "$gray",
                    color: "$black",
                },
                "& span": {
                    color: "$white",
                },
                "& svg": {
                    fill: "$white",
                },
                backgroundColor: "transparent",
                color: "$white",
            },
            fillStyle: "Ghost",
        },
        {
            colorType: "Neutral",
            css: {
                "&:focus-visible": {
                    focusRing: "$white",
                },
                "&:hover": {
                    "& span": {
                        color: "$black",
                    },
                    "& svg": {
                        fill: "$black",
                    },
                    backgroundColor: "$gray",
                    border: "1px solid $gray",
                    color: "$black",
                },
                "& span": {
                    color: "$white",
                },
                "& svg": {
                    fill: "$white",
                },
                backgroundColor: "transparent",
                border: "1px solid $white",
                color: "$white",
            },
            fillStyle: "Outline",
        },
        {
            colorType: "Destructive",
            css: {
                "&:focus-visible": {
                    focusRing: "$danger",
                },
                "&:hover": {
                    backgroundColor: "#F73F3F",
                },
                "& span": {
                    color: "$black",
                },
                "& svg": {
                    fill: "$black",
                },
                backgroundColor: "$danger",
                color: "$black",
            },
            fillStyle: "Solid",
        },
        {
            colorType: "Destructive",
            css: {
                "&:focus-visible": {
                    focusRing: "$danger",
                },
                "&:hover": {
                    "& span": {
                        color: "$black",
                    },
                    "& svg": {
                        fill: "$black",
                    },
                    backgroundColor: "#F73F3F",
                    color: "$black",
                },
                "& span": {
                    color: "$danger",
                },
                "& svg": {
                    fill: "$danger",
                },
                backgroundColor: "transparent",
                color: "$danger",
            },
            fillStyle: "Ghost",
        },
        {
            css: {
                "& svg": {
                    height: 16,
                    width: 16,
                },
                height: 32,
                padding: 0,
                width: 32,
            },
            iconOnly: true,
            size: "Small",
        },
        {
            css: {
                "& svg": {
                    height: 24,
                    width: 24,
                },
                height: 40,
                padding: 0,
                width: 40,
            },
            iconOnly: true,
            size: "Default",
        },
    ],
    cursor: "pointer",
    display: "flex",
    gap: 8,
    outline: "none",
    textOverflow: "ellipsis",
    variants: {
        // This is named to prevent conflicts with the native `disabled` attribute
        _disabled: {
            true: {
                cursor: "not-allowed",
                opacity: 0.5,
            },
        },
        align: {
            center: {
                justifyContent: "center",
            },
            left: {
                justifyContent: "flex-start",
            },
            right: {
                justifyContent: "flex-end",
            },
        },
        colorType: {
            Destructive: {},
            Neutral: {},
        },
        fillStyle: {
            Ghost: {},
            Outline: {},
            Solid: {},
        },
        iconOnly: {
            true: {
                alignItems: "center",
                display: "flex",
                flexShrink: 0,
                justifyContent: "center",
            },
        },
        size: {
            Default: {
                height: 40,
                paddingBottom: 9.5,
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 9.5,
            },
            Small: {
                height: 32,
                paddingBottom: 8,
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 8,
            },
        },
    },
    whiteSpace: "nowrap",
    width: "fit-content",
});

Button.displayName = "Button";

export type { ButtonProps };
export { Button };
