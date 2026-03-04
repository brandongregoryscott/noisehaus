import type { AlertDialog as RadixAlertDialog } from "radix-ui";
import { Dialog as RadixDialog } from "radix-ui";
import React from "react";
import { Box } from "@/components/box";

type DialogOverlayProps = {
    as?: typeof RadixAlertDialog.Overlay | typeof RadixDialog.Overlay;
};

const DialogOverlay: React.FC<DialogOverlayProps> = (props) => {
    const { as = RadixDialog.Overlay } = props;
    return (
        <Box
            as={as}
            css={{
                backgroundColor: "rgba(0, 0, 0, 0.9)",
                inset: 0,
                position: "fixed",
            }}
        />
    );
};

export { DialogOverlay };
