import { z } from "zod";

const feedbackValidator = z
    .string()
    .trim()
    .min(1, "Feedback must be at least 1 character long");

const emailValidator = z.string().trim().email("Email must be a valid format");

const optionalEmailValidator = z.preprocess((value) => {
    if (typeof value === "string" && value.trim() === "") {
        return undefined;
    }
    return value;
}, emailValidator.optional());

const feedbackFormValidator = z.object({
    email: optionalEmailValidator,
    feedback: feedbackValidator,
});

export { emailValidator, feedbackFormValidator, feedbackValidator };
