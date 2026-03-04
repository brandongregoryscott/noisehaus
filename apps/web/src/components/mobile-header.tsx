import { Logo } from "@/components/logo";
import { Row } from "@/components/row";

type MobileHeaderProps = {
    leftContent?: React.ReactNode;
    rightContent?: React.ReactNode;
};

const MobileHeader: React.FC<MobileHeaderProps> = (props) => {
    const { leftContent, rightContent } = props;
    return (
        <Row
            css={{
                alignItems: "center",
                alignSelf: "stretch",
                justifyContent: "space-between",
                paddingBottom: 8,
                paddingTop: 8,
                width: "100%",
            }}>
            <Row css={{ width: "100%" }}>{leftContent}</Row>
            <Row
                css={{
                    height: "100%",
                    justifyContent: "center",
                    width: "100%",
                }}>
                <Logo />
            </Row>
            <Row css={{ justifyContent: "flex-end", width: "100%" }}>
                {rightContent}
            </Row>
        </Row>
    );
};

export { MobileHeader };
