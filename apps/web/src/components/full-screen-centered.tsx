import { Column } from "@/components/column";

type FullScreenCenteredProps = {
    children: NonNullable<React.ReactNode>;
};

const FullScreenCentered: React.FC<FullScreenCenteredProps> = (props) => {
    const { children } = props;
    return (
        <Column
            css={{
                alignItems: "center",
                gap: 32,
                height: "100%",
                justifyContent: "center",
                width: "100%",
            }}>
            {children}
        </Column>
    );
};

export { FullScreenCentered };
