import { describe, expect, it, assert } from "vitest";
import { validate } from "../validation";
import { nameValidator } from "./board-file-validators";

describe("board file validators", () => {
    it("accepts valid board file names", () => {
        const input = "Readme";

        const result = validate(nameValidator, input);

        expect(result.success).toBe(true);
    });

    it("rejects empty board file names", () => {
        const input = "";

        const result = validate(nameValidator, input);

        assert(!result.success);
        expect(result.error.issues[0]?.message).toBe(
            "Name must be at least 1 character long"
        );
    });
});
