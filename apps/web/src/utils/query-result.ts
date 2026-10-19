import type { Result } from "common";

// TanStack Query recognizes failed operations through rejected promises.
const toQueryPromise = async <T, E>(
    operation: Promise<Result<T, E>> | Result<T, E>
): Promise<T> => {
    const result = await operation;
    if (result.isErr) {
        throw result.error;
    }
    return result.value;
};

export { toQueryPromise };
