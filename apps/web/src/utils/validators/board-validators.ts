import { z } from "zod";

const nameValidator = z
    .string()
    .trim()
    .min(1, "Name must be at least 1 character long");

const slugValidator = z
    .string()
    .trim()
    .regex(
        /^[a-z0-9-]*$/,
        "Slug must contain only lowercase letters, numbers, and hyphens"
    )
    .min(6, "Slug must be 6 characters or longer");

const boardValidator = z.object({
    name: nameValidator,
    slug: slugValidator,
});

export { boardValidator, nameValidator, slugValidator };
