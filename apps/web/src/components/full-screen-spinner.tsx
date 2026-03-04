import { FullScreenCentered } from "@/components/full-screen-centered";
import { ReelSpinner } from "@/components/reel-spinner";
import { Text } from "@/components/text";

type FullScreenSpinnerProps = {
    message?: string;
};

const FullScreenSpinner: React.FC<FullScreenSpinnerProps> = (props) => {
    const { message } = props;
    return (
        <FullScreenCentered>
            <ReelSpinner />
            {message !== undefined && <Text as="code">{message}</Text>}
        </FullScreenCentered>
    );
};

export { FullScreenSpinner };
