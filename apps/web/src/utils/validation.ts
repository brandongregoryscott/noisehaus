import type { z } from "zod";

type ValidationResult<TValue> = z.SafeParseReturnType<unknown, TValue>;

type FieldErrors<TValue> = z.typeToFlattenedError<TValue>["fieldErrors"];

const validate = <TSchema extends z.ZodTypeAny>(
    schema: TSchema,
    value: unknown
): ValidationResult<z.infer<TSchema>> => schema.safeParse(value);

const getFieldErrors = <TValue>(
    result: ValidationResult<TValue>
): FieldErrors<TValue> => {
    if (result.success) {
        return {} as z.typeToFlattenedError<TValue>["fieldErrors"];
    }

    return result.error.flatten().fieldErrors;
};

export type { FieldErrors, ValidationResult };
export { getFieldErrors, validate };
