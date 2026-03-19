import { describe, expect, it, assert } from "vitest";
import { validate } from "../validation";
import {
    emailValidator,
    feedbackFormValidator,
    commentValidator,
} from "./feedback-validators";

describe("commentValidator", () => {
    it("accepts valid comment", () => {
        const input = "Thanks!";

        const result = validate(commentValidator, input);

        expect(result.success).toBe(true);
    });

    it("rejects blank comment", () => {
        const input = "   ";

        const result = validate(commentValidator, input);

        assert(!result.success);
        expect(result.error.issues[0]?.message).toBe(
            "Feedback must be at least 1 character long"
        );
    });
});

describe("emailValidator", () => {
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
});

describe("feedbackFormValidator", () => {
    it("allows blank email in feedback form", () => {
        const input = {
            comment: "Nice work",
            email: "   ",
        };

        const result = validate(feedbackFormValidator, input);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.email).toBeUndefined();
        }
    });
});
