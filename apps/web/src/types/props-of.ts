import type { AnyFunction } from "@/types/any-function";

type PropsOf<T extends AnyFunction> = Parameters<T>[0];

export type { PropsOf };
