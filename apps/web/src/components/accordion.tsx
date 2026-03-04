import { Accordion as RadixAccordion } from "radix-ui";
import { forwardRef } from "react";
import type { PropsOf } from "@/types/props-of";
import { Box } from "@/components/box";
import { keyframes } from "@/utils/theme";

const slideDown = keyframes({
    from: { height: 0 },
    to: { height: "var(--radix-accordion-content-height)" },
});

const slideUp = keyframes({
    from: { height: "var(--radix-accordion-content-height)" },
    to: { height: 0 },
});

const Accordion: typeof RadixAccordion = { ...RadixAccordion };

Accordion.Content = forwardRef<
    HTMLDivElement,
    PropsOf<typeof RadixAccordion.Content>
>((props, ref) => {
    const { children, ...rest } = props;
    return (
        <Box
            as={RadixAccordion.Content}
            css={{
                "&[data-state='closed']": {
                    animation: `${slideUp} 240ms cubic-bezier(0.87, 0, 0.13, 1)`,
                },
                "&[data-state='open']": {
                    animation: `${slideDown} 240ms cubic-bezier(0.87, 0, 0.13, 1)`,
                },
            }}
            ref={ref}
            {...rest}>
            {children}
        </Box>
    );
});

Accordion.Content.displayName = "AccordionContent";

export { Accordion };
