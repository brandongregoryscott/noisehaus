import { describe, expect, it, assert } from "vitest";
import { validate } from "../validation";
import { nameValidator, slugValidator } from "./board-validators";

describe("board validators", () => {
    it("accepts valid board names", () => {
        const input = "My Board";

        const result = validate(nameValidator, input);

        expect(result.success).toBe(true);
    });

    it("rejects empty board names", () => {
        const input = "   ";

        const result = validate(nameValidator, input);

        assert(!result.success);
        expect(result.error.issues[0]?.message).toBe(
            "Name must be at least 1 character long"
        );
    });

    it("accepts valid slugs", () => {
        const input = "good-slug";

        const result = validate(slugValidator, input);

        expect(result.success).toBe(true);
    });

    it("rejects slugs with uppercase letters or spaces", () => {
        const input = "Bad Slug";

        const result = validate(slugValidator, input);

        assert(!result.success);
        expect(result.error.issues[0]?.message).toBe(
            "Slug must contain only lowercase letters, numbers, and hyphens"
        );
    });

    it("rejects slugs that are too short", () => {
        const input = "abc";

        const result = validate(slugValidator, input);

        assert(!result.success);
        expect(result.error.issues[0]?.message).toBe(
            "Slug must be 6 characters or longer"
        );
    });
});
