import { err, ok, ValidationError } from "common";
import { describe, expect, it } from "vitest";
import { toQueryPromise } from "./query-result";

describe("toQueryPromise", () => {
    it("resolves the successful payload for TanStack Query", async () => {
        const value = { id: "board-a" };
        const directResult = ok(value);
        const promisedResult = Promise.resolve(ok(false));

        const direct = toQueryPromise(directResult);
        const promised = toQueryPromise(promisedResult);

        await expect(direct).resolves.toBe(value);
        await expect(promised).resolves.toBe(false);
    });

    it("rejects with the original error so Query can track failure", async () => {
        const error = new ValidationError("Invalid board");
        const directResult = err(error);
        const promisedResult = Promise.resolve(err(error));

        const direct = toQueryPromise(directResult);
        const promised = toQueryPromise(promisedResult);

        await expect(direct).rejects.toBe(error);
        await expect(promised).rejects.toBe(error);
    });
});
