import { createStitches } from "@stitches/react";

const colors = {
    black: "#0D0D0D",
    blueDark: "#2AA2C7",
    blueLight: "#33CEFF",
    danger: "#FF6B6B",
    gray: "#B0B0B0",
    positive: "#258339",
    white: "#ffffff",
} as const;

const fonts = {
    body: "'Poppins', sans-serif",
    code: "'Victor Mono', monospace",
} as const;

type ColorToken = `$${keyof typeof colors}`;

type FontFamilyToken = `$${keyof typeof fonts}`;

const { css, getCssText, globalCss, keyframes, styled } = createStitches({
    theme: {
        colors,
        fonts,
        shadows: { ...colors },
    },
    utils: {
        focusRing: (color: ColorToken) => ({
            boxShadow: `0 0 0 2px $black, 0 0 0 3px ${color}`,
        }),
        marginX: (value: number) => ({ marginLeft: value, marginRight: value }),
        marginY: (value: number) => ({ marginBottom: value, marginTop: value }),
        paddingX: (value: number) => ({
            paddingLeft: value,
            paddingRight: value,
        }),
        paddingY: (value: number) => ({
            paddingBottom: value,
            paddingTop: value,
        }),
    },
});

const globalStyles = globalCss({
    "::selection": {
        backgroundColor: "$gray",
        color: "$black",
    },
    "*": {
        color: "$white",
        fontFamily: "$body",
        scrollbarColor: `${colors.gray} ${colors.black}`,
        scrollbarWidth: "thin",
    },
    a: {
        "&:hover": {
            textDecoration: "underline",
        },
        textDecoration: "none",
    },
    code: {
        fontFamily: "$code",
    },
});

export type { ColorToken, FontFamilyToken };
export { css, getCssText, globalStyles, keyframes, styled };
