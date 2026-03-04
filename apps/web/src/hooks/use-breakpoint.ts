import { useState, useEffect } from "react";

const BREAKPOINTS = {
    desktop: 577,
    mobile: 576,
};

type BreakpointName = keyof typeof BREAKPOINTS;

const useBreakpoint = (): BreakpointName => {
    const [breakpoint, setBreakpoint] = useState<BreakpointName>(getBreakpoint);

    useEffect(() => {
        const handleResize = () => {
            setBreakpoint(getBreakpoint());
        };

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return breakpoint;
};

const getBreakpoint = (): BreakpointName => {
    if (typeof window === "undefined") {
        return "desktop";
    }

    return window.innerWidth <= BREAKPOINTS.mobile ? "mobile" : "desktop";
};

export type { BreakpointName };
export { useBreakpoint };
