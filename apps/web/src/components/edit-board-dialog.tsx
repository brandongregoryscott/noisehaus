import type { ApiError, Board } from "common";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ErrorName, GET_BOARD_ROUTE, ViewPermission } from "common";
import { Box } from "@/components/box";
import { Button } from "@/components/button";
import { Field } from "@/components/field";
import { Heading } from "@/components/heading";
import { Input } from "@/components/input";
import {
    ResponsiveDialog,
    ResponsiveDialogBody,
    ResponsiveDialogFooter,
    ResponsiveDialogHeader,
} from "@/components/responsive-dialog";
import { ViewPermissionAlert } from "@/components/view-permission-alert";
import { ViewPermissionSelect } from "@/components/view-permission-select";
import { useEditBoard } from "@/hooks/use-edit-board";
import { useToast } from "@/hooks/use-toast";
import { Routes } from "@/routes";

type EditBoardDialogProps = {
    board: Board;
    isOpen: boolean;
    onClose: () => void;
    token: string;
};

const EditBoardDialog: React.FC<EditBoardDialogProps> = (props) => {
    const { board, isOpen, onClose, token } = props;
    const {
        name: initialName,
        slug: initialSlug,
        view_permission: initialViewPermission,
    } = board;
    const navigate = useNavigate();
    const { openDestructive } = useToast();
    const client = useQueryClient();
    const handleError = (error: ApiError) => {
        let message = error.message;
        if (
            error.name === ErrorName.ERROR_UNIQUE_CONSTRAINT &&
            error.message.includes("slug")
        ) {
            message = `The slug '${slug}' is already taken. Please choose another.`;
        }

        openDestructive({
            description: message,
            title: "Error updating board",
        });
    };

    const handleSuccess = () => {
        client.invalidateQueries({
            queryKey: [GET_BOARD_ROUTE],
        });

        if (slug !== initialSlug) {
            navigate({
                params: { slug, token },
                to: Routes.BoardByToken,
            });
        }

        onClose();
    };

    const {
        handleNameChange,
        handleNameClear,
        handleNameInput,
        handleSave,
        handleSlugChange,
        handleSlugClear,
        handleSlugInput,
        handleViewPermissionChange,
        isPending,
        name,
        nameErrorMessage,
        slug,
        slugErrorMessage,
        viewPermission,
    } = useEditBoard({
        initialName,
        initialSlug,
        initialViewPermission: initialViewPermission as ViewPermission,
        onError: handleError,
        onSuccess: handleSuccess,
        token,
    });

    return (
        <ResponsiveDialog isOpen={isOpen} onClose={onClose}>
            <ResponsiveDialogHeader>
                <Heading size="h3">Edit Board</Heading>
            </ResponsiveDialogHeader>
            <ResponsiveDialogBody css={{ rowGap: 24 }}>
                <Field fullWidth={true} label="Board Name">
                    <Input
                        errorMessage={nameErrorMessage}
                        onChange={handleNameChange}
                        onClear={handleNameClear}
                        onInput={handleNameInput}
                        placeholder="Board Name"
                        showClearAffordance={true}
                        value={name}
                        width="100%"
                    />
                </Field>
                <Field fullWidth={true} label="Board Slug">
                    <Input
                        errorMessage={slugErrorMessage}
                        onChange={handleSlugChange}
                        onClear={handleSlugClear}
                        onInput={handleSlugInput}
                        placeholder="Board Slug"
                        showClearAffordance={true}
                        value={slug}
                        width="100%"
                    />
                </Field>
                <Field fullWidth={true} label="Board Visibility">
                    <ViewPermissionAlert
                        viewPermission={ViewPermission.BySlug}
                    />
                    <ViewPermissionSelect
                        onChange={handleViewPermissionChange}
                        value={viewPermission}
                    />
                </Field>
            </ResponsiveDialogBody>
            <ResponsiveDialogFooter>
                <Button fillStyle="Ghost" onClick={onClose}>
                    Cancel
                </Button>
                <Button isLoading={isPending} onClick={handleSave}>
                    Save
                </Button>
            </ResponsiveDialogFooter>
        </ResponsiveDialog>
    );
};

export { EditBoardDialog };
