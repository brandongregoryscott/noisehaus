import React from "react";
import {
    AlertDialog,
    AlertDialogHeader,
    AlertDialogBody,
    AlertDialogFooter,
} from "@/components/alert-dialog";
import { Button } from "@/components/button";
import { Heading } from "@/components/heading";

type DeleteBoardConfirmationProps = {
    isLoading: boolean;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

const DeleteBoardConfirmation: React.FC<DeleteBoardConfirmationProps> = (
    props
) => {
    const { isLoading, isOpen, onClose, onConfirm } = props;
    return (
        <AlertDialog isOpen={isOpen} onClose={onClose}>
            <AlertDialogHeader>
                <Heading size="h3">Delete Board</Heading>
            </AlertDialogHeader>
            <AlertDialogBody>
                Are you sure you want to delete this board? This action cannot
                be reversed.
            </AlertDialogBody>
            <AlertDialogFooter>
                <Button
                    disabled={isLoading}
                    fillStyle="Ghost"
                    onClick={onClose}>
                    Cancel
                </Button>
                <Button isLoading={isLoading} onClick={onConfirm}>
                    Delete
                </Button>
            </AlertDialogFooter>
        </AlertDialog>
    );
};

export { DeleteBoardConfirmation };
