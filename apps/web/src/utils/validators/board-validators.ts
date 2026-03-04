const nameValidator = {
    length: {
        checkValidity: (value: string | undefined) =>
            value !== undefined && value.length > 0,
        errorMessage: "Name must be at least 1 character long",
    },
};

const slugValidator = {
    case: {
        checkValidity: (value: string | undefined) =>
            value !== undefined && !/[^a-z0-9\-]+/g.test(value),
        errorMessage:
            "Slug must contain only lowercase letters, numbers, and hyphens",
    },
    length: {
        checkValidity: (value: string | undefined) =>
            value !== undefined && value.length >= 6,
        errorMessage: "Slug must be 6 characters or longer",
    },
};

export { nameValidator, slugValidator };
