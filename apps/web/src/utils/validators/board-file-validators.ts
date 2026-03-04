const nameValidator = {
    length: {
        checkValidity: (value: string | undefined) =>
            value !== undefined && value.length > 0,
        errorMessage: "Name must be at least 1 character long",
    },
};

export { nameValidator };
