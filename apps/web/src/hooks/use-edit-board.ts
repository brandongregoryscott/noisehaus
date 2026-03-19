import type { ApiError, Board, ViewPermission } from "common";
import type { FormEvent } from "react";
import { isEmpty, kebabCase } from "lodash-es";
import { useState } from "react";
import { useUpdateBoard } from "@/hooks/use-update-board";
import { getFieldErrors, validate } from "@/utils/validation";
import { boardValidator } from "@/utils/validators/board-validators";

type UseEditBoardOptions = {
    initialName: string;
    initialSlug: string;
    initialViewPermission: ViewPermission;
    onError?: (error: ApiError) => void;
    onSuccess?: (updatedBoard: Board) => void;
    token: string;
};

type UseEditBoardResult = {
    errors: {
        name?: string[];
        slug?: string[];
    };
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
    slug: string;
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
    const [errors, setErrors] = useState<{
        name?: string[];
        slug?: string[];
    }>({});
    const [slug, setSlug] = useState<string>(initialSlug);
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

        const validationState = validate(boardValidator, {
            name: updatedName,
            slug,
        });
        const validationErrors = getFieldErrors(validationState);
        setErrors((currentErrors) => ({
            ...currentErrors,
            name: validationErrors.name,
        }));
    };

    const handleSlugClear = () => setSlug("");
    const handleSlugInput = (event: FormEvent<HTMLInputElement>) =>
        setSlug((event.target as HTMLInputElement).value);
    const handleSlugChange = async (event: FormEvent<HTMLInputElement>) => {
        const updatedSlug = (event.target as HTMLInputElement).value;
        setSlug(updatedSlug);

        const validationState = validate(boardValidator, {
            name,
            slug: updatedSlug,
        });
        const validationErrors = getFieldErrors(validationState);
        setErrors((currentErrors) => ({
            ...currentErrors,
            slug: validationErrors.slug,
        }));
    };

    const handleSave = async () => {
        const result = validate(boardValidator, { name, slug });
        const validationErrors = getFieldErrors(result);
        setErrors(validationErrors);

        if (!result.success) {
            return;
        }

        updateBoard({
            name: result.data.name,
            slug: result.data.slug,
            token,
            view_permission: viewPermission,
        });
    };

    return {
        errors,
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
        slug,
        viewPermission,
    };
};

export { useEditBoard };
