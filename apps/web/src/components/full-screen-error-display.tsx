import type { ErrorDisplayProps } from "@/components/error-display";
import { ErrorDisplay } from "@/components/error-display";
import { FullScreenCentered } from "@/components/full-screen-centered";

const FullScreenErrorDisplay: React.FC<ErrorDisplayProps> = (props) => {
    return (
        <FullScreenCentered>
            <ErrorDisplay {...props} />
        </FullScreenCentered>
    );
};

export { FullScreenErrorDisplay };
