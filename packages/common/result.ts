import type { Err as MythErr, Ok as MythOk } from "true-myth/result";
import type MythResult from "true-myth/result";
import { err as mythErr, ok as mythOk } from "true-myth/result";
import {
    NotFoundError,
    PersistenceError,
    UniqueConstraintError,
    ValidationError,
} from "./errors";

type Failure<E, SpecificError> = {
    readonly error: E & SpecificError;
    readonly isErr: true;
    readonly isOk: false;
};

abstract class ResultChecks<E> {
    isNotFoundError(): this is Failure<E, NotFoundError> & this {
        return this instanceof ErrResult && this.error instanceof NotFoundError;
    }

    isPersistenceError(): this is Failure<E, PersistenceError> & this {
        return (
            this instanceof ErrResult && this.error instanceof PersistenceError
        );
    }

    isUniqueConstraintError(
        field?: string
    ): this is Failure<E, UniqueConstraintError> & this {
        return (
            this instanceof ErrResult &&
            this.error instanceof UniqueConstraintError &&
            (field === undefined || this.error.field === field)
        );
    }

    isValidationError(): this is Failure<E, ValidationError> & this {
        return (
            this instanceof ErrResult && this.error instanceof ValidationError
        );
    }
}

// The public contract contains no library types or methods.
type Result<T, E> = (
    | { readonly error: E; readonly isErr: true; readonly isOk: false }
    | { readonly isErr: false; readonly isOk: true; readonly value: T }
) &
    ResultChecks<E>;

class OkResult<T, E> extends ResultChecks<E> {
    readonly isErr = false;
    readonly isOk = true;
    #result: MythOk<T, E>;

    constructor(result: MythOk<T, E>) {
        super();
        this.#result = result;
    }

    get value(): T {
        return this.#result.value;
    }
}

class ErrResult<T, E> extends ResultChecks<E> {
    readonly isErr = true;
    readonly isOk = false;
    #result: MythErr<T, E>;

    constructor(result: MythErr<T, E>) {
        super();
        this.#result = result;
    }

    get error(): E {
        return this.#result.error;
    }
}

const wrap = <T, E>(result: MythResult<T, E>): Result<T, E> =>
    result.isOk ? new OkResult(result) : new ErrResult(result);

const ok = <T, E = never>(value: T): Result<T, E> => wrap(mythOk<T, E>(value));
const err = <E, T = never>(error: E): Result<T, E> =>
    wrap(mythErr<T, E>(error));

export type { Result };
export { err, ok };
