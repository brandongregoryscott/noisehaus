import { Alert } from "@/components/alert";
import { Icon } from "@/components/icon";

type ErrorDisplayProps = {
    message: string;
    name: string;
};

const ErrorDisplay: React.FC<ErrorDisplayProps> = (props) => {
    const { message, name } = props;
    return (
        <Alert
            description={message}
            icon={<Icon name="TriangleExclamationMark" size={48} />}
            title={name}
        />
    );
};

export type { ErrorDisplayProps };
export { ErrorDisplay };
