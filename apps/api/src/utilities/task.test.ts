import type { Result, ValidationError } from "common";
import { err, ok, PersistenceError, Task, UniqueConstraintError } from "common";
import { assert, describe, expect, expectTypeOf, it, vi } from "vitest";

describe("Task", () => {
    it("passes values through dependent async operations and synchronous mapping", async () => {
        const authorize = vi.fn(async () => ok({ id: "board-a" }));
        const write = vi.fn(async (id: string) => ok({ boardId: id }));

        const result = await Task.fromPromise(authorize)
            .andThen((board) => write(board.id))
            .map((file) => file.boardId)
            .toPromise();

        assert(result.isOk);
        expect(result.value).toBe("board-a");
        expect(write).toHaveBeenCalledExactlyOnceWith("board-a");
    });

    it("skips dependent operations and mapping after a typed failure", async () => {
        const error = new UniqueConstraintError(
            "slug",
            "Slug is taken",
            undefined
        );
        const write = vi.fn(async (_id: string) => ok(true));
        const transform = vi.fn(() => "saved");

        const result = await Task.fromResult(err(error))
            .andThen(write)
            .map(transform)
            .toPromise();

        assert(result.isUniqueConstraintError("slug"));
        expect(result.error).toBe(error);
        expect(write).not.toHaveBeenCalled();
        expect(transform).not.toHaveBeenCalled();
    });

    it("combines error types and preserves a failure from a later async step", async () => {
        const error = new PersistenceError(new Error("Write unavailable"));
        const authorize = async (): Promise<Result<string, ValidationError>> =>
            ok("board-a");
        const write = vi.fn(async (_id: string) => err(error));
        const afterWrite = vi.fn(() => ok(true));

        const result = await Task.fromPromise(authorize)
            .andThen(write)
            .andThen(afterWrite)
            .toPromise();

        expectTypeOf(result).toEqualTypeOf<
            Result<boolean, PersistenceError | ValidationError>
        >();
        assert(result.isPersistenceError());
        expect(result.error).toBe(error);
        expect(afterWrite).not.toHaveBeenCalled();
    });

    it("composes nested Tasks while retaining the outer value in scope", async () => {
        const quota = vi.fn(async () => ok(undefined));
        const write = vi.fn(async (id: string) => ok(id));

        const result = await Task.fromResult(ok({ id: "board-a" }))
            .andThen((board) =>
                Task.fromPromise(quota).andThen(() => write(board.id))
            )
            .toPromise();

        assert(result.isOk);
        expect(result.value).toBe("board-a");
        expect(write).toHaveBeenCalledExactlyOnceWith("board-a");
    });

    it("does not start a dependent operation while its prerequisite is pending", async () => {
        let authorize!: (result: Result<string, ValidationError>) => void;
        const pending = new Promise<Result<string, ValidationError>>(
            (resolve) => {
                authorize = resolve;
            }
        );
        const write = vi.fn(async (id: string) => ok(id));
        const task = Task.fromPromise(() => pending).andThen(write);

        await Promise.resolve();
        const startedBeforeAuthorization = write.mock.calls.length;
        authorize(ok("board-a"));
        const result = await task.toPromise();

        expect(startedBeforeAuthorization).toBe(0);
        assert(result.isOk);
        expect(write).toHaveBeenCalledExactlyOnceWith("board-a");
    });

    it("preserves a synchronous exception from the initial operation", async () => {
        const error = new Error("Broken configuration");
        const operation = () => {
            throw error;
        };
        const afterFailure = vi.fn(() => ok(true));

        const promise = Task.fromPromise(operation)
            .andThen(afterFailure)
            .toPromise();

        await expect(promise).rejects.toBe(error);
        expect(afterFailure).not.toHaveBeenCalled();
    });

    it("preserves a rejected promise from the initial operation", async () => {
        const error = new Error("Unexpected read failure");
        const operation = async () => {
            throw error;
        };
        const afterFailure = vi.fn(() => ok(true));

        const promise = Task.fromPromise(operation)
            .andThen(afterFailure)
            .toPromise();

        await expect(promise).rejects.toBe(error);
        expect(afterFailure).not.toHaveBeenCalled();
    });

    it("preserves synchronous exceptions from a continuation", async () => {
        const error = new Error("Broken invariant");
        const operation = () => {
            throw error;
        };
        const afterFailure = vi.fn(() => ok(true));

        const promise = Task.fromResult(ok("board-a"))
            .andThen(operation)
            .andThen(afterFailure)
            .toPromise();

        await expect(promise).rejects.toBe(error);
        expect(afterFailure).not.toHaveBeenCalled();
    });

    it("preserves rejected promises from a continuation", async () => {
        const error = new Error("Unexpected write failure");
        const operation = async () => {
            throw error;
        };
        const afterFailure = vi.fn(() => ok(true));

        const promise = Task.fromResult(ok("board-a"))
            .andThen(operation)
            .andThen(afterFailure)
            .toPromise();

        await expect(promise).rejects.toBe(error);
        expect(afterFailure).not.toHaveBeenCalled();
    });

    it("preserves exceptions from mapping instead of leaving a pending Task", async () => {
        const error = new Error("Unexpected mapping failure");
        const transform = () => {
            throw error;
        };

        const promise = Task.fromResult(ok("board-a"))
            .map(transform)
            .toPromise();

        await expect(promise).rejects.toBe(error);
    });
});
