const feedbackValidator = {
    length: {
        checkValidity: (value: string | undefined) =>
            value != null && value.length > 0,
        errorMessage: "Feedback must be at least 1 character long",
    },
};

const emailValidator = {
    format: {
        checkValidity: (value: string | undefined) =>
            value != null &&
            value.length >= 5 &&
            value.includes("@") &&
            value.includes("."),
        errorMessage: "Email must be a valid format",
    },
};

export { emailValidator, feedbackValidator };
