import { Accordion } from "@/components/accordion";

type SingleItemAccordionProps = {
    children: React.ReactNode;
    isOpen: boolean | undefined;
};

const SingleItemAccordion: React.FC<SingleItemAccordionProps> = (props) => {
    const { children, isOpen } = props;
    return (
        <Accordion.Root type="single" value={isOpen?.toString()}>
            <Accordion.Item value={true.toString()}>
                <Accordion.Content>{children}</Accordion.Content>
            </Accordion.Item>
        </Accordion.Root>
    );
};

export { SingleItemAccordion };
