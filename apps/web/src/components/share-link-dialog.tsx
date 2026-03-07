import type { Board } from "common";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import type { IconName } from "@/components/icon";
import { Box } from "@/components/box";
import { Button } from "@/components/button";
import { Field } from "@/components/field";
import { Heading } from "@/components/heading";
import { Icon } from "@/components/icon";
import { Input } from "@/components/input";
import {
    ResponsiveDialog,
    ResponsiveDialogBody,
    ResponsiveDialogFooter,
    ResponsiveDialogHeader,
} from "@/components/responsive-dialog";
import { Routes } from "@/routes";
import { prependDomain } from "@/utils/route-utils";

type ShareLinkDialogProps = {
    board: Board;
    isOpen: boolean;
    onClose: () => void;
    token?: string;
};

const ShareLinkDialog: React.FC<ShareLinkDialogProps> = (props) => {
    const { board, isOpen, onClose, token } = props;
    const router = useRouter();

    const [isPublicLinkCopied, setIsPublicLinkCopied] = useState(false);
    const [isAdminLinkCopied, setIsAdminLinkCopied] = useState(false);

    const publicLink = prependDomain(
        router.buildLocation({
            params: { slug: board.slug },
            to: Routes.BoardShort,
        }).publicHref
    );

    const adminLink =
        token != null
            ? prependDomain(
                  router.buildLocation({
                      params: { slug: board.slug, token },
                      to: Routes.BoardByTokenShort,
                  }).publicHref
              )
            : undefined;

    const handleCopyPublicLink = () => {
        window.navigator.clipboard.writeText(publicLink);
        setIsPublicLinkCopied(true);
        setIsAdminLinkCopied(false);

        setTimeout(() => setIsPublicLinkCopied(false), 1500);
    };

    const handleCopyAdminLink = () => {
        if (adminLink === undefined) {
            return;
        }

        window.navigator.clipboard.writeText(adminLink);
        setIsPublicLinkCopied(false);
        setIsAdminLinkCopied(true);

        setTimeout(() => setIsAdminLinkCopied(false), 1500);
    };

    const publicLinkIcon: IconName = isPublicLinkCopied ? "Checkmark" : "Link";

    const adminLinkIcon: IconName = isAdminLinkCopied ? "Checkmark" : "Link";

    return (
        <ResponsiveDialog isOpen={isOpen} onClose={onClose}>
            <ResponsiveDialogHeader>
                <Heading size="h3">Share Link</Heading>
            </ResponsiveDialogHeader>
            <ResponsiveDialogBody>
                <Box
                    css={{
                        display: "flex",
                        flexDirection: "column",
                        rowGap: 24,
                    }}>
                    <Field label="Public Link">
                        <Input
                            readOnly={true}
                            rightIcon={
                                <Button
                                    css={{
                                        "& svg": {
                                            height: 12,
                                            width: 12,
                                        },
                                        backgroundColor: "$black",
                                        height: 20,
                                        padding: 0,
                                        width: 20,
                                    }}
                                    fillStyle="Ghost"
                                    onClick={handleCopyPublicLink}
                                    size="Small">
                                    <Icon name={publicLinkIcon} />
                                </Button>
                            }
                            value={publicLink}
                            width="100%"
                        />
                    </Field>
                    {adminLink != null && (
                        <Field
                            description="This link can be used to edit your board. Make sure
                    you bookmark it and keep it private."
                            label="Admin Link">
                            <Input
                                readOnly={true}
                                rightIcon={
                                    <Button
                                        css={{
                                            "& svg": {
                                                height: 12,
                                                width: 12,
                                            },
                                            backgroundColor: "$black",
                                            height: 20,
                                            padding: 0,
                                            width: 20,
                                        }}
                                        fillStyle="Ghost"
                                        onClick={handleCopyAdminLink}
                                        size="Small">
                                        <Icon name={adminLinkIcon} />
                                    </Button>
                                }
                                value={adminLink}
                                width="100%"
                            />
                        </Field>
                    )}
                </Box>
            </ResponsiveDialogBody>
            <ResponsiveDialogFooter>
                <Button onClick={onClose}>Done</Button>
            </ResponsiveDialogFooter>
        </ResponsiveDialog>
    );
};

export { ShareLinkDialog };
