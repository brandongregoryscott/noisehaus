import { vi } from "vitest";

type QueryResult = {
    count?: null | number;
    data: unknown;
    error?: unknown;
};

type QueryCall = {
    args: unknown[];
    method: string;
    table: string;
};

const state = {
    calls: [] as QueryCall[],
    maybeSingleQueue: [] as QueryResult[],
    resultQueue: [] as QueryResult[],
    singleQueue: [] as QueryResult[],
    throwOnErrorQueue: [] as unknown[],
};

const defaultResult = (): QueryResult => ({ data: null });

const dequeue = (queue: QueryResult[]): QueryResult => {
    const next = queue.shift();
    return next ?? defaultResult();
};

const createQueryBuilder = (table: string) => {
    const record = (method: string, args: unknown[]) => {
        state.calls.push({ args, method, table });
    };

    const builder = {
        delete: vi.fn((...args: unknown[]) => {
            record("delete", args);
            return builder;
        }),
        eq: vi.fn((...args: unknown[]) => {
            record("eq", args);
            return builder;
        }),
        filter: vi.fn((...args: unknown[]) => {
            record("filter", args);
            return builder;
        }),
        insert: vi.fn((...args: unknown[]) => {
            record("insert", args);
            return builder;
        }),
        maybeSingle: vi.fn(async () => dequeue(state.maybeSingleQueue)),
        order: vi.fn((...args: unknown[]) => {
            record("order", args);
            return builder;
        }),
        select: vi.fn((...args: unknown[]) => {
            record("select", args);
            return builder;
        }),
        single: vi.fn(async () => dequeue(state.singleQueue)),
        throwOnError: vi.fn(() => {
            record("throwOnError", []);
            const error = state.throwOnErrorQueue.shift();
            if (error !== undefined) {
                throw error;
            }
            return builder;
        }),
        update: vi.fn((...args: unknown[]) => {
            record("update", args);
            return builder;
        }),
    };

    return {
        ...builder,
        then: (
            onfulfilled?: (value: QueryResult) => unknown,
            onrejected?: (reason: unknown) => unknown
        ) =>
            Promise.resolve(dequeue(state.resultQueue)).then(
                onfulfilled,
                onrejected
            ),
    };
};

const from = vi.fn((table: string) => {
    state.calls.push({ args: [table], method: "from", table });
    return createQueryBuilder(table);
});

const SupabaseClientMock = {
    from,
};

const resetSupabaseClientMock = (): void => {
    state.calls.length = 0;
    state.maybeSingleQueue.length = 0;
    state.resultQueue.length = 0;
    state.singleQueue.length = 0;
    state.throwOnErrorQueue.length = 0;
    from.mockClear();
};

const queueSingleResult = (data: unknown): void => {
    state.singleQueue.push({ data });
};

const queueMaybeSingleResult = (data: unknown): void => {
    state.maybeSingleQueue.push({ data });
};

const queueResult = (data: unknown): void => {
    state.resultQueue.push({ data });
};

const queueThrowOnError = (error: unknown): void => {
    state.throwOnErrorQueue.push(error);
};

const getSupabaseQueryCalls = (): QueryCall[] => state.calls;

export {
    getSupabaseQueryCalls,
    queueMaybeSingleResult,
    queueResult,
    queueSingleResult,
    queueThrowOnError,
    resetSupabaseClientMock,
    SupabaseClientMock,
};
