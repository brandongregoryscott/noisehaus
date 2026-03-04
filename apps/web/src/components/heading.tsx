import * as React from "react";

type HeadingProps = {
    children: React.ReactNode;
    size: Extract<
        keyof JSX.IntrinsicElements,
        "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
    >;
};

const Heading: React.FC<HeadingProps> = (props) => {
    const { children, size } = props;
    // eslint-disable-next-line react/no-children-prop
    return React.createElement(size, {
        children,
    });
};

export type { HeadingProps };
export { Heading };
