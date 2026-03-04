import { Box } from "@/components/box";
import { Icon } from "@/components/icon";

type InputErrorDisplayProps = {
    errorMessage: string | undefined;
};

const InputErrorDisplay: React.FC<InputErrorDisplayProps> = (props) => {
    const { errorMessage } = props;
    return (
        <Box
            css={{
                alignItems: "center",
                backgroundColor: "$danger",
                borderBottomLeftRadius: 8,
                borderBottomRightRadius: 8,
                color: "$black",
                display: "flex",
                gap: 4,
                paddingBottom: 8,
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 8,
                wordBreak: "break-word",
            }}>
            <Icon name="TriangleExclamationMark" />
            {errorMessage}
        </Box>
    );
};

export { InputErrorDisplay };
