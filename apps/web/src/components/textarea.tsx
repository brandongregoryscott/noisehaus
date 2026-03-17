import { forwardRef, useState } from "react";
import { Box } from "@/components/box";
import { Button } from "@/components/button";
import { Icon } from "@/components/icon";
import { InputErrorDisplay } from "@/components/input-error-display";
import { styled } from "@/utils/theme";

type TextareaProps = {
    colorType?: "Destructive" | "Neutral";
    errorMessage?: string;
    onChange?: (event: React.FormEvent<HTMLTextAreaElement>) => void;
    onClear?: () => void;
    onInput?: (event: React.FormEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    readOnly?: boolean;
    rightIcon?: React.ReactNode;
    showClearAffordance?: boolean;
    size?: "Default" | "Small";
    value?: string;
    width?: `${number}%` | number;
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    (props, ref) => {
        const {
            colorType = "Neutral",
            errorMessage,
            onChange,
            onClear,
            onInput,
            placeholder,
            readOnly,
            rightIcon,
            showClearAffordance = false,
            size = "Default",
            value,
            width,
        } = props;
        const [isFocused, setIsFocused] = useState<boolean>(false);
        const handleFocus = () => {
            setIsFocused(true);
        };

        const handleBlur = () => {
            setIsFocused(false);
        };

        const hasError = errorMessage != null;

        return (
            <StyleTextareaContainer
                colorType={colorType}
                css={{ width: width === "100%" ? width : "fit-content" }}
                hasError={hasError}
                isFocused={isFocused}>
                <StyledTextarea
                    colorType={colorType}
                    hasError={hasError}
                    onBlur={handleBlur}
                    onChange={onChange}
                    onFocus={handleFocus}
                    onInput={onInput}
                    placeholder={placeholder}
                    readOnly={readOnly}
                    ref={ref}
                    size={size}
                    value={value}
                />
                {(rightIcon != null || showClearAffordance) && (
                    <Box
                        css={{
                            position: "absolute",
                            right: 16,
                            top: 10,
                        }}>
                        {rightIcon ?? (
                            <Button
                                css={{
                                    "& svg": {
                                        height: 16,
                                        width: 16,
                                    },
                                    borderRadius: 4,
                                    height: 20,
                                    padding: 0,
                                    width: 20,
                                }}
                                fillStyle="Ghost"
                                onClick={onClear}>
                                <Icon color="$white" name="X" />
                            </Button>
                        )}
                    </Box>
                )}
                {hasError && <InputErrorDisplay errorMessage={errorMessage} />}
            </StyleTextareaContainer>
        );
    }
);

Textarea.displayName = "Textarea";

const StyleTextareaContainer = styled("div", {
    borderRadius: 8,
    compoundVariants: [
        {
            colorType: "Neutral",
            css: {
                focusRing: "$white",
            },
            isFocused: true,
        },
        {
            colorType: "Destructive",
            css: {
                focusRing: "$danger",
            },
            isFocused: true,
        },
        {
            css: {
                focusRing: "$danger",
            },
            hasError: true,
            isFocused: true,
        },
    ],
    display: "flex",
    flexDirection: "column",
    height: "fit-content",
    position: "relative",
    variants: {
        colorType: {
            Destructive: {},
            Neutral: {},
        },
        hasError: {
            true: {},
        },
        isFocused: {
            true: {},
        },
    },
    width: "fit-content",
});

const StyledTextarea = styled("textarea", {
    backgroundColor: "black",
    border: "1px solid white",
    borderRadius: "inherit",
    outline: "none",
    paddingBottom: 8,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
    resize: "vertical",
    variants: {
        colorType: {
            Destructive: {
                "&:hover": {
                    boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.5)",
                },
                border: "1px solid $danger",
                color: "$danger",
            },
            Neutral: {
                "&:hover": {
                    boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.5)",
                },
                border: "1px solid $white",
                color: "$white",
            },
        },
        hasError: {
            true: {
                border: "1px solid $danger",
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
            },
        },
        size: {
            Default: {
                minHeight: 120,
                paddingBottom: 9.5,
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 9.5,
            },
            Small: {
                minHeight: 80,
                paddingBottom: 8,
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 8,
            },
        },
    },
});

export { Textarea };
