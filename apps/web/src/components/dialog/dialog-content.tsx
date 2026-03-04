import type { AlertDialog as RadixAlertDialog } from "radix-ui";
import { Dialog as RadixDialog } from "radix-ui";
import { Box } from "@/components/box";

type DialogContentProps = {
    as?: typeof RadixAlertDialog.Content | typeof RadixDialog.Content;
    children: React.ReactNode;
};

const DialogContent: React.FC<DialogContentProps> = (props) => {
    const { as = RadixDialog.Content, children } = props;
    return (
        <Box
            as={as}
            css={{
                backgroundColor: "$black",
                border: "1px solid white",
                borderRadius: 8,
                color: "$white",
                display: "flex",
                flexDirection: "column",
                left: "50%",
                maxHeight: "85vh",
                maxWidth: 500,
                outline: "none",
                overflow: "hidden",
                position: "fixed",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: "90vw",
            }}>
            {children}
        </Box>
    );
};

export { DialogContent };
