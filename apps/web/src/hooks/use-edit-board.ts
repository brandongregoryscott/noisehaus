import type { ApiError, Board, ViewPermission } from "common";
import type { FormEvent } from "react";
import { isEmpty, kebabCase } from "lodash-es";
import { useState } from "react";
import { useUpdateBoard } from "@/hooks/use-update-board";
import { validate } from "@/utils/validation";
import {
    nameValidator,
    slugValidator,
} from "@/utils/validators/board-validators";

type UseEditBoardOptions = {
    initialName: string;
    initialSlug: string;
    initialViewPermission: ViewPermission;
    onError?: (error: ApiError) => void;
    onSuccess?: (updatedBoard: Board) => void;
    token: string;
};

type UseEditBoardResult = {
    handleNameChange: (event: FormEvent<HTMLInputElement>) => void;
    handleNameClear: () => void;
    handleNameInput: (event: FormEvent<HTMLInputElement>) => void;
    handleSave: () => void;
    handleSlugChange: (event: FormEvent<HTMLInputElement>) => void;
    handleSlugClear: () => void;
    handleSlugInput: (event: FormEvent<HTMLInputElement>) => void;
    handleViewPermissionChange: (value: ViewPermission) => void;
    isPending: boolean;
    name: string;
    nameErrorMessage: string | undefined;
    slug: string;
    slugErrorMessage: string | undefined;
    viewPermission: ViewPermission;
};

const useEditBoard = (options: UseEditBoardOptions): UseEditBoardResult => {
    const {
        initialName,
        initialSlug,
        initialViewPermission,
        onError,
        onSuccess,
        token,
    } = options;
    const [name, setName] = useState<string>(initialName);
    const [nameErrorMessage, setNameErrorMessage] = useState<
        string | undefined
    >(undefined);
    const [slug, setSlug] = useState<string>(initialSlug);
    const [slugErrorMessage, setSlugErrorMessage] = useState<
        string | undefined
    >(undefined);
    const [viewPermission, setViewPermission] = useState<ViewPermission>(
        initialViewPermission
    );
    const { isPending, mutate: updateBoard } = useUpdateBoard({
        onError,
        onSuccess,
        slug: initialSlug,
    });

    const handleNameClear = () => setName("");
    const handleNameInput = (event: FormEvent<HTMLInputElement>) => {
        const name = (event.target as HTMLInputElement).value;
        setName(name);
        if (isEmpty(slug)) {
            setSlug(kebabCase(name));
        }
    };

    const handleNameChange = async (event: FormEvent<HTMLInputElement>) => {
        const updatedName = (event.target as HTMLInputElement).value;
        setName(updatedName);

        if (isEmpty(slug)) {
            setSlug(kebabCase(updatedName));
        }

        const validationState = validate(nameValidator, updatedName);
        setNameErrorMessage(validationState?.firstError);
    };

    const handleSlugClear = () => setSlug("");
    const handleSlugInput = (event: FormEvent<HTMLInputElement>) =>
        setSlug((event.target as HTMLInputElement).value);
    const handleSlugChange = async (event: FormEvent<HTMLInputElement>) => {
        const updatedSlug = (event.target as HTMLInputElement).value;
        setSlug(updatedSlug);

        const validationState = validate(slugValidator, updatedSlug);
        setSlugErrorMessage(validationState?.firstError);
    };

    const handleSave = async () => {
        const nameValidationState = validate(nameValidator, name);
        const slugValidationState = validate(slugValidator, slug);

        setNameErrorMessage(nameValidationState?.firstError);
        setSlugErrorMessage(slugValidationState?.firstError);

        if (
            nameValidationState !== undefined ||
            slugValidationState !== undefined
        ) {
            return;
        }

        updateBoard({ name, slug, token, view_permission: viewPermission });
    };

    return {
        handleNameChange,
        handleNameClear,
        handleNameInput,
        handleSave,
        handleSlugChange,
        handleSlugClear,
        handleSlugInput,
        handleViewPermissionChange: setViewPermission,
        isPending,
        name,
        nameErrorMessage,
        slug,
        slugErrorMessage,
        viewPermission,
    };
};

export { useEditBoard };
