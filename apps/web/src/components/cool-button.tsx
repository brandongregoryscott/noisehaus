import React from "react";
import type { IconName } from "@/components/icon";
import { Box } from "@/components/box";
import { Icon } from "@/components/icon";
import { Row } from "@/components/row";
import { styled } from "@/utils/theme";

type CoolButtonProps = {
    children?: React.ReactNode;
    height?: number | string;
    intent?: "primary" | "secondary";
    leftIcon?: IconName;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    width?: number | string;
};

const CoolButton: React.FC<CoolButtonProps> = (props) => {
    const { children, height, intent = "secondary", leftIcon, onClick } = props;
    const width = props.width ?? "fit-content";
    const backgroundColor = intent === "primary" ? "$white" : "$black";
    const color = intent === "primary" ? "$black" : "$white";
    const borderColor = color;

    return (
        <Box
            css={{
                backgroundColor,
                borderColor,
                borderRadius: 16,
                borderStyle: "solid",
                borderWidth: 1,
                display: "flex",
                padding: 8,
                width: "100%",
            }}>
            <Box
                css={{
                    backgroundImage: `repeating-linear-gradient(45deg, ${color} 25%, transparent 25%, transparent 75%, ${color} 75%, ${color}), repeating-linear-gradient(45deg, ${color} 25%, ${backgroundColor} 25%, ${backgroundColor} 75%, ${color} 75%, ${color});`,
                    backgroundPosition: "0 0, 10px 10px",
                    backgroundSize: "4px 4px",
                    borderRadius: 8,
                    boxShadow: `inset -1px -1px ${borderColor}, inset 1px -1px ${borderColor}`,
                    width,
                }}>
                <StyledButton
                    css={{ height, width }}
                    intent={intent}
                    onClick={onClick}>
                    <Row
                        css={{
                            alignItems: "center",
                            color: "inherit",
                            gap: 8,
                            justifyContent: "center",
                        }}>
                        {leftIcon != null && <Icon name={leftIcon} />}
                        {children}
                    </Row>
                </StyledButton>
            </Box>
        </Box>
    );
};

const StyledButton = styled("button", {
    "&:active": {
        transform: "translateY(0px)",
    },
    "&:hover": {
        transform: "translateY(-6px)",
    },
    alignItems: "center",
    appearance: "none",
    border: "none",
    borderRadius: 8,
    borderStyle: "solid",
    borderWidth: 1,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    outline: "none",
    paddingBottom: 12,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 12,
    transform: "translateY(-12px)",
    variants: {
        intent: {
            primary: {
                "&:focus-visible": {
                    boxShadow: "0 0 0 2px $white, 0 0 0 3px $black",
                },
                backgroundColor: "$white",
                borderColor: "$black",
                color: "$black",
            },
            secondary: {
                "&:focus-visible": {
                    focusRing: "$white",
                },
                backgroundColor: "$black",
                borderColor: "$white",
                color: "$white",
            },
        },
    },
});

export { CoolButton };
