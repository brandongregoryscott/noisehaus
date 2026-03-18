import { describe, expect, it, assert } from "vitest";
import { validate } from "../validation";
import {
    emailValidator,
    feedbackFormValidator,
    feedbackValidator,
} from "./feedback-validators";

describe("feedback validators", () => {
    it("accepts valid feedback", () => {
        const input = "Thanks!";

        const result = validate(feedbackValidator, input);

        expect(result.success).toBe(true);
    });

    it("rejects blank feedback", () => {
        const input = "   ";

        const result = validate(feedbackValidator, input);

        assert(!result.success);
        expect(result.error.issues[0]?.message).toBe(
            "Feedback must be at least 1 character long"
        );
    });

    it("accepts valid email addresses", () => {
        const input = "person@example.com";

        const result = validate(emailValidator, input);

        expect(result.success).toBe(true);
    });

    it("rejects invalid email addresses", () => {
        const input = "not-an-email";

        const result = validate(emailValidator, input);

        assert(!result.success);
        expect(result.error.issues[0]?.message).toBe(
            "Email must be a valid format"
        );
    });

    it("allows blank email in feedback form", () => {
        const input = {
            email: "   ",
            feedback: "Nice work",
        };

        const result = validate(feedbackFormValidator, input);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.email).toBeUndefined();
        }
    });
});
