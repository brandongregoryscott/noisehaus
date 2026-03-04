import { Popover as RadixPopover } from "radix-ui";
import { forwardRef } from "react";
import type { PropsOf } from "@/types/props-of";
import { Box } from "@/components/box";

const Popover: typeof RadixPopover = { ...RadixPopover };

Popover.Content = forwardRef<
    HTMLDivElement,
    PropsOf<typeof RadixPopover.Content>
>((props, ref) => {
    const { children, ...rest } = props;
    return (
        <RadixPopover.Content ref={ref} {...rest}>
            <Box
                css={{
                    backgroundColor: "$black",
                    border: "2px solid $white",
                    borderRadius: 8,
                    display: "flex",
                    flexDirection: "column",
                    padding: 8,
                }}>
                {children}
            </Box>
        </RadixPopover.Content>
    );
});

Popover.Content.displayName = "PopoverContent";

export { Popover };
