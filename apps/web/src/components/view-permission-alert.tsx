import { ViewPermission } from "common";
import { isEmpty } from "lodash-es";
import React from "react";
import { Column } from "@/components/column";
import { Icon } from "@/components/icon";
import { Row } from "@/components/row";

type ViewPermissionAlertProps = {
    viewPermission: ViewPermission;
};

const ViewPermissionAlert: React.FC<ViewPermissionAlertProps> = (
    props: ViewPermissionAlertProps
) => {
    const { viewPermission } = props;
    const title = getTitle(viewPermission);
    const description = getDescription(viewPermission);
    return (
        <Column css={{ rowGap: 8 }}>
            {isEmpty(title) ? (
                <Row css={{ columnGap: 4 }}>
                    <Icon name="TriangleExclamationMark" />
                    <span>{description}</span>
                </Row>
            ) : (
                <>
                    <Row css={{ alignItems: "center", gap: 4 }}>
                        <Icon color="$white" name="TriangleExclamationMark" />
                        <span>{title}</span>
                    </Row>
                    <Row>{description}</Row>
                </>
            )}
        </Column>
    );
};

const getTitle = (viewPermission: ViewPermission): string => {
    switch (viewPermission) {
        case ViewPermission.ByToken:
            return "This board is only viewable and editable from this link.";
        case ViewPermission.BySlug:
            return "This board is viewable by anyone with the slug.";
        case ViewPermission.Public:
            return "This board viewable by anyone with the slug and also shows up in the browse list.";
        default:
            return "";
    }
};

const getDescription = (viewPermission: ViewPermission): string => {
    switch (viewPermission) {
        case ViewPermission.ByToken:
        case ViewPermission.BySlug:
            return "If you lose the link to this board, you will be unable to edit it, and it may be deleted after a period of inactivity.";
        case ViewPermission.Public:
        default:
            return "Only you can edit this board from this page.";
    }
};

export { ViewPermissionAlert };
