import type { z } from "zod";

type ValidationResult<TValue> = z.ZodSafeParseResult<TValue>;

type FieldErrors<TValue> = z.ZodFlattenedError<TValue>["fieldErrors"];

const validate = <TSchema extends z.ZodTypeAny>(
    schema: TSchema,
    value: unknown
): ValidationResult<z.infer<TSchema>> => schema.safeParse(value);

const getFieldErrors = <TValue>(
    result: ValidationResult<TValue>
): FieldErrors<TValue> => {
    if (result.success) {
        return {} as z.ZodFlattenedError<TValue>["fieldErrors"];
    }

    return result.error.flatten().fieldErrors;
};

export type { FieldErrors, ValidationResult };
export { getFieldErrors, validate };
