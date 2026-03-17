import { useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { FeedbackDialog } from "@/components/feedback-dialog";
import { Icon } from "@/components/icon";
import { Link } from "@/components/link";
import { Row } from "@/components/row";
import { Text } from "@/components/text";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { styled } from "@/utils/theme";

const Footer = () => {
    const breakpoint = useBreakpoint();
    const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] =
        useState<boolean>(false);
    const boardSlug = useRouterState({
        select: (state) => {
            for (const match of state.matches) {
                if ("slug" in match.params) {
                    return match.params.slug;
                }
            }

            return undefined;
        },
    });

    const handleOpenFeedbackDialog = () => {
        setIsFeedbackDialogOpen(true);
    };

    const handleCloseFeedbackDialog = () => {
        setIsFeedbackDialogOpen(false);
    };

    return (
        <>
            <StyledFooter breakpoint={breakpoint}>
                <Link
                    css={{ textDecoration: "underline" }}
                    onClick={handleOpenFeedbackDialog}>
                    <Icon color="$white" name="Comment" />
                    <Text as="code" fontSize={11}>
                        leave some feedback
                    </Text>
                </Link>
                {breakpoint === "desktop" && (
                    <Icon color="$white" name="X" size={12} />
                )}
                <Link
                    css={{ textDecoration: "underline" }}
                    href="https://github.com/brandongregoryscott/noisehaus">
                    <Icon color="$white" name="Github" />
                    <Text as="code" fontSize={11}>
                        view on github
                    </Text>
                </Link>
                {breakpoint === "desktop" && (
                    <Icon color="$white" name="X" size={12} />
                )}
                <Row css={{ fontFamily: "$code", fontSize: 11, gap: 4 }}>
                    created with love in lancaster
                    <Icon color="$white" name="Pennsylvania" />
                    & brooklyn
                    <Icon color="$white" name="NewYork" />
                </Row>
            </StyledFooter>
            {isFeedbackDialogOpen && (
                <FeedbackDialog
                    boardSlug={boardSlug}
                    isOpen={true}
                    onClose={handleCloseFeedbackDialog}
                />
            )}
        </>
    );
};

const StyledFooter = styled("div", {
    alignItems: "center",
    backgroundColor: "$black",
    bottom: 0,
    color: "$white",
    display: "flex",
    justifyContent: "center",
    padding: 8,
    position: "sticky",
    variants: {
        breakpoint: {
            desktop: {
                flexDirection: "row",
                gap: 8,
            },
            mobile: {
                flexDirection: "column",
                gap: 4,
            },
        },
    },
    width: "100%",
});

export { Footer };
