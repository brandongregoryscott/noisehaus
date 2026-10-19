import type { StoreError, Result } from "common";
import {
    PersistenceError,
    UniqueConstraintError,
    ValidationError,
    err,
    ok,
} from "common";
import { isObjectLike } from "lodash-es";
import {
    PocketBaseHttpError,
    PocketBaseTransportError,
} from "@/pocketbase-client";

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

// HTTP and transport failures become results; programming errors still reject.
const withPocketBaseResult =
    <Args extends unknown[], Value>(
        operation: (...args: Args) => Promise<Value>
    ): ((...args: Args) => Promise<Result<Value, StoreError>>) =>
    async (...args) => {
        try {
            return ok(await operation(...args));
        } catch (error) {
            if (error instanceof PocketBaseTransportError) {
                return err(new PersistenceError(error));
            }
            if (!(error instanceof PocketBaseHttpError)) {
                throw error;
            }
            return err(toStoreError(error));
        }
    };

export { withPocketBaseResult };
