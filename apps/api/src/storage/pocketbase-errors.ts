import { isObjectLike } from "lodash-es";
import { PocketBaseHttpError } from "@/pocketbase-client";
import {
    PersistenceError,
    UniqueConstraintError,
    ValidationError,
} from "@/utilities/errors";

type ErrorBody = {
    data?: Record<string, { code?: string; message?: string }>;
    message?: string;
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

            if (error.status !== 400 || !isObjectLike(error.data)) {
                throw new PersistenceError(error);
            }

            const body = error.data as ErrorBody;
            const uniqueConstraint = Object.entries(body.data ?? {}).find(
                ([, value]) => value.code === "validation_not_unique"
            );
            if (uniqueConstraint != null) {
                const [field, value] = uniqueConstraint;
                // A missing provider message must not prevent slug retries.
                throw new UniqueConstraintError(
                    field,
                    value.message ?? "Value must be unique",
                    error
                );
            }

            const fieldMessage = Object.values(body.data ?? {}).find(
                (value) => value.message != null
            )?.message;
            const message = fieldMessage ?? body.message;
            if (message == null) {
                throw new PersistenceError(error);
            }

            throw new ValidationError(message, error);
        }
    };

export { withPocketBaseErrors };
