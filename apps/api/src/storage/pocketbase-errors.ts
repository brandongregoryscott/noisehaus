import { isObjectLike } from "lodash-es";
import type { StoreError } from "@/utilities/errors";
import type { Result } from "@/utilities/result";
import { PocketBaseHttpError } from "@/pocketbase-client";
import {
    PersistenceError,
    UniqueConstraintError,
    ValidationError,
} from "@/utilities/errors";
import { err, ok } from "@/utilities/result";

type ErrorBody = {
    data?: Record<string, { code?: string; message?: string }>;
    message?: string;
};

const toStoreError = (error: PocketBaseHttpError): StoreError => {
    if (error.status !== 400 || !isObjectLike(error.data)) {
        return new PersistenceError(error);
    }

    const body = error.data as ErrorBody;
    const uniqueConstraint = Object.entries(body.data ?? {}).find(
        ([, value]) => value.code === "validation_not_unique"
    );
    if (uniqueConstraint != null) {
        const [field, value] = uniqueConstraint;
        // A missing provider message must not prevent slug retries.
        return new UniqueConstraintError(
            field,
            value.message ?? "Value must be unique",
            error
        );
    }

    const fieldMessage = Object.values(body.data ?? {}).find(
        (value) => value.message != null
    )?.message;
    const message = fieldMessage ?? body.message;
    return message == null
        ? new PersistenceError(error)
        : new ValidationError(message, error);
};

// Only provider failures become results; programming errors still reject.
const withPocketBaseResult =
    <Args extends unknown[], Value>(
        operation: (...args: Args) => Promise<Value>
    ): ((...args: Args) => Promise<Result<Value, StoreError>>) =>
    async (...args) => {
        try {
            return ok(await operation(...args));
        } catch (error) {
            if (!(error instanceof PocketBaseHttpError)) {
                throw error;
            }
            return err(toStoreError(error));
        }
    };

// Stores expose application errors; the transport retains PocketBase diagnostics.
const withPocketBaseErrors =
    <Args extends unknown[], Result>(
        operation: (...args: Args) => Promise<Result>
    ): ((...args: Args) => Promise<Result>) =>
    async (...args) => {
        try {
            return await operation(...args);
        } catch (error) {
            if (!(error instanceof PocketBaseHttpError)) {
                throw error;
            }

            throw toStoreError(error);
        }
    };

export { withPocketBaseErrors, withPocketBaseResult };
