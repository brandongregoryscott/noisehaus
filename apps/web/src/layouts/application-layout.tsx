import type { CSS } from "@stitches/react";
import { useEffect, useState } from "react";
import type { BreakpointName } from "@/hooks/use-breakpoint";
import { Box } from "@/components/box";
import { Column } from "@/components/column";
import { Header } from "@/components/header";
import { Link } from "@/components/link";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { Routes } from "@/routes";

type ApplicationLayoutProps = {
    children: React.ReactNode;
};

const ApplicationLayout: React.FC<ApplicationLayoutProps> = (props) => {
    const { children } = props;
    const breakpoint = useBreakpoint();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- We are doing this to prevent a flash of unstyled content
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return;
    }

    return (
        <Box
            css={{
                backgroundColor: "$black",
                height: "100vh",
                overflowX: "hidden",
                overflowY: "auto",
                width: "100vw",
            }}>
            <Column css={getInnerColumnStyles(breakpoint)}>
                {breakpoint === "desktop" && (
                    <Header size="h1">
                        <Link to={Routes.Home}>noise.haus</Link>
                    </Header>
                )}
                {children}
            </Column>
        </Box>
    );
};

const getInnerColumnStyles = (breakpoint: BreakpointName): CSS => {
    switch (breakpoint) {
        case "mobile":
            return {
                height: "100%",
                maxHeight: "100%",
                paddingBottom: 8,
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 8,
                width: "100%",
            };
        case "desktop":
        default:
            return {
                height: "100%",
                marginLeft: "auto",
                marginRight: "auto",
                paddingBottom: 16,
                width: "50%",
            };
    }
};

export { ApplicationLayout };
