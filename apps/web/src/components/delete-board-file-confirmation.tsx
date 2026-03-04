import React from "react";
import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
} from "@/components/alert-dialog";
import { Button } from "@/components/button";
import { Heading } from "@/components/heading";

type DeleteBoardFileConfirmation = {
    isLoading: boolean;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

const DeleteBoardFileConfirmation: React.FC<DeleteBoardFileConfirmation> = (
    props
) => {
    const { isLoading, isOpen, onClose, onConfirm } = props;
    return (
        <AlertDialog isOpen={isOpen} onClose={onClose}>
            <AlertDialogHeader>
                <Heading size="h3">Delete Sound</Heading>
            </AlertDialogHeader>
            <AlertDialogBody>
                Are you sure you want to delete this sound? This action cannot
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

export { DeleteBoardFileConfirmation };
