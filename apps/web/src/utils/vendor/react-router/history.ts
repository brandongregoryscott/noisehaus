/* eslint-disable */

/**
 * @private
 */
export function invariant(value: boolean, message?: string): asserts value;
export function invariant<T>(
    value: T | null | undefined,
    message?: string
): asserts value is T;
export function invariant(value: any, message?: string) {
    if (value === false || value === null || typeof value === "undefined") {
        throw new Error(message);
    }
}

export function warning(cond: any, message: string) {
    if (!cond) {
        if (typeof console !== "undefined") console.warn(message);

        try {
            // Welcome to debugging history!
            //
            // This error is thrown as a convenience, so you can more easily
            // find the source for a warning that appears in the console by
            // enabling "pause on exceptions" in your JavaScript debugger.
            throw new Error(message);
        } catch (e) {}
    }
}
