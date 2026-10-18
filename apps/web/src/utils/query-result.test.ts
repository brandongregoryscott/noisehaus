import { err, ok, ValidationError } from "common";
import { describe, expect, it } from "vitest";
import { toQueryPromise } from "./query-result";

describe("toQueryPromise", () => {
    it("resolves the successful payload for TanStack Query", async () => {
        const value = { id: "board-a" };
        await expect(toQueryPromise(ok(value))).resolves.toBe(value);
        await expect(toQueryPromise(Promise.resolve(ok(false)))).resolves.toBe(
            false
        );
    });

    it("rejects with the original error so Query can track failure", async () => {
        const error = new ValidationError("Invalid board");
        await expect(toQueryPromise(err(error))).rejects.toBe(error);
        await expect(toQueryPromise(Promise.resolve(err(error)))).rejects.toBe(
            error
        );
    });
});
