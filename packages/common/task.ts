import type { Task as MythTask } from "true-myth/task";
import { reject, resolve, tryOrElse } from "true-myth/task";
import type { Err, Result } from "./result";
import { err, ok } from "./result";

// Keep unexpected exceptions separate from typed application failures.
class UnexpectedFailure {
    constructor(readonly cause: unknown) {}
}

/** Eager async Result composition, backed by True Myth Task. */
class Task<T, E> {
    #task: MythTask<T, E | UnexpectedFailure>;

    // eslint-disable-next-line collation/prefer-native-private-syntax -- JavaScript has no private constructor syntax.
    private constructor(task: MythTask<T, E | UnexpectedFailure>) {
        this.#task = task;
    }

    static err<E, T = never>(error: E): Task<T, E> {
        return new Task<T, E>(reject(error));
    }

    /** The callback catches both synchronous throws and promise rejections. */
    static fromPromise<T, E>(
        operation: () => PromiseLike<Result<T, E>>
    ): Task<T, E> {
        return new Task<T, E>(
            tryOrElse(
                (cause) => new UnexpectedFailure(cause),
                async () => operation()
            ).andThen((result) => Task.fromResult(result).#task)
        );
    }

    static fromResult<T, E>(result: Result<T, E>): Task<T, E> {
        return new Task<T, E>(
            result.isErr ? reject(result.error) : resolve(result.value)
        );
    }

    static ok<T, E = never>(value: T): Task<T, E> {
        return new Task<T, E>(resolve(value));
    }

    /** Only invoke the next operation when the preceding one succeeds. */
    andThen<U, F>(
        operation: (
            value: T
        ) => PromiseLike<Result<U, F>> | Result<U, F> | Task<U, F>
    ): Task<U, E | F> {
        return new Task<U, E | F>(
            this.#task.andThen((value) =>
                tryOrElse(
                    (cause) => new UnexpectedFailure(cause),
                    async () => operation(value)
                ).andThen((next) =>
                    next instanceof Task
                        ? next.#task
                        : Task.fromResult(next).#task
                )
            )
        );
    }

    map<U>(transform: (value: T) => U): Task<U, E> {
        return this.andThen((value) => ok(transform(value)));
    }

    /** Recover from an expected failure; unexpected exceptions bypass recovery. */
    orElse<U, F>(
        operation: (
            error: E
        ) => PromiseLike<Result<U, F>> | Result<U, F> | Task<U, F>
    ): Task<T | U, F> {
        return new Task<T | U, F>(
            this.#task.orElse((error): MythTask<U, F | UnexpectedFailure> => {
                if (error instanceof UnexpectedFailure) {
                    return reject(error);
                }
                return tryOrElse(
                    (cause) => new UnexpectedFailure(cause),
                    async () => operation(error)
                ).andThen((next) =>
                    next instanceof Task
                        ? next.#task
                        : Task.fromResult(next).#task
                );
            })
        );
    }

    /** Recover using the application Result predicates instead of a raw error. */
    orElseResult<U, F>(
        operation: (
            result: Err<E>
        ) => PromiseLike<Result<U, F>> | Result<U, F> | Task<U, F>
    ): Task<T | U, F> {
        return this.orElse((error) => operation(err(error)));
    }

    /** Preserve the application's Result predicates and exception boundary. */
    async toPromise(): Promise<Result<T, E>> {
        const result = await this.#task;
        if (result.isOk) {
            return ok(result.value);
        }
        if (result.error instanceof UnexpectedFailure) {
            throw result.error.cause;
        }
        return err(result.error);
    }
}

export { Task };
