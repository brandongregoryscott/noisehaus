import * as React from "react";
import type { HeadingProps } from "@/components/heading";
import { Column } from "@/components/column";
import { Heading } from "@/components/heading";
import { Logo } from "@/components/logo";
import { Row } from "@/components/row";

type HeaderProps = {} & HeadingProps;

const Header: React.FC<HeaderProps> = (props) => {
    const { children, size } = props;
    return (
        <Column css={{ marginTop: 16, width: "100%" }}>
            <Row
                css={{
                    justifyContent: "space-between",
                }}>
                <Heading size={size}>{children}</Heading>
                <Logo />
            </Row>
            <Row
                css={{
                    borderBottom: "1px solid $white",
                    marginY: 16,
                    width: "100%",
                }}
            />
        </Column>
    );
};

export type { HeaderProps };
export { Header };
