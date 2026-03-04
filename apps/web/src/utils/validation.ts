type ValidityState = {
    customErrors?: Record<string, { errorMessage: string }>;
    firstError: string;
    nativeErrors?: Record<string, { errorMessage: string }>;
    valid: boolean;
};

type Validator<TValue = unknown> = {
    [key: string]: {
        checkValidity: (value: TValue) => boolean;
        errorMessage?: string;
    };
};

const validateAll = <TValue>(
    validator: Validator<TValue>,
    value: TValue
): ValidityState[] =>
    Object.keys(validator).map((key) => {
        const { checkValidity, errorMessage = "" } = validator[key];
        const valid = checkValidity(value);

        return {
            firstError: valid ? "" : errorMessage,
            valid,
        };
    });

const validate = <TValue>(
    validator: Validator<TValue>,
    value: TValue
): undefined | ValidityState =>
    validateAll(validator, value).find(
        (validationState) => !validationState.valid
    );

export { validate, validateAll };
