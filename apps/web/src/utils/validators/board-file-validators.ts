import { z } from "zod";

const nameValidator = z
    .string()
    .trim()
    .min(1, "Name must be at least 1 character long");

const boardFileValidator = z.object({
    file: z.custom<File>((value) => value instanceof File, "File is required"),
    name: nameValidator,
});

export { boardFileValidator, nameValidator };
