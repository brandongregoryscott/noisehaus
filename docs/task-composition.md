# Task composition

API services use an application-owned `Task<T, E>` backed by True Myth 9.4.0.
The adapter lives in `packages/common/task.ts`. Stores continue to return
`Promise<Result<T, E>>`; services compose those operations with Task and convert
back to `Promise<Result<T, E>>` at their public boundary.

## Reading a dependent sequence

Previously, deletion repeated the failure propagation and value extraction:

```ts
const boardFileResult = await getWritableFile(id, boardSlug, token);
if (boardFileResult.isErr) {
    return boardFileResult;
}
const boardFile = boardFileResult.value;
const deleteResult = await BoardFilesStore.delete(boardFile.id);
return deleteResult.isErr ? deleteResult : ok(true);
```

Deletion now expresses that sequence as:

```ts
return getWritableFile(id, boardSlug, token)
    .andThen((boardFile) => BoardFilesStore.delete(boardFile.id))
    .map(() => true as const)
    .toPromise();
```

`andThen` receives the successful value and only starts its callback after the
preceding operation succeeds. It accepts an application Result, a promise of one,
or another application Task. Error types accumulate as a union. `map` changes a
successful value. Both skip their callbacks after a failure. The `boardFile`
variable is the actual file, so there is no need for a wrapper variable or `.value`.

Private helpers such as `getWritableFile`, `getByIdAndBoardId`,
`verifyRemainingSize`, and `normalizeCreateInput` return Task directly. They can
be chained without wrapping them again. For example, an upload checks capacity
before writing:

```ts
.andThen((board) =>
    verifyRemainingSize(board.id, incomingSizeInBytes)
        .andThen(() => BoardFilesStore.bulkInsert(/* files for board.id */))
)
```

This nesting keeps the board available to the write. Keep business branches
inside callbacks when that reads more clearly; do not introduce data-carrying
helpers only to flatten a chain. Callbacks returning different error types may
need an explicit `Result<T, E>` return annotation to guide TypeScript inference.

## Integration and behavior

- Imports stay in `common`; True Myth types do not appear in service signatures.
- `fromPromise` takes a callback producing an existing `Promise<Result<T, E>>`.
  It starts immediately. Pass dependent work inside `andThen` callbacks; creating
  a promise before the chain would start that work too early.
- Call `.toPromise()` once at the service boundary. It returns the same
  `Promise<Result<T, E>>` consumed by controllers and existing callers. The
  application adapter deliberately is not directly awaitable; awaiting a raw
  True Myth Task would expose its own Result rather than our error predicates.
- Expected failures preserve their error object and application Result predicates.
  Unexpected synchronous throws and rejected promises remain exceptions when
  `.toPromise()` is awaited, so Express's fallback handler still receives them.
  The adapter tracks these exceptions separately inside the underlying Task.
- The adapter uses safe constructors for both initial work and continuation
  callbacks. It does not use `fromUnsafePromise`, whose non-rejection assumption
  does not hold for our services. It also guards exceptions from mapping callbacks.
- Task composition adds no retries, parallel writes, cancellation, or timeout policy.
  Authorization, ownership checks, and quota checks still precede writes.

## Explicit decisions and boundaries

Use `andThen` for dependent steps and `map` for successful value transformations.
Keep domain decisions visible: an absent optional feedback board is allowed,
whereas a missing or unauthorized requested board is not found. Branching on
those values inside callbacks remains ordinary business logic.

Board creation retains its explicit Result-based retry decision. Only a confirmed
slug conflict permits retry, with the existing attempt limit. A general automatic
retry would be unsafe for writes with an ambiguous outcome.

Transport error translation, HTTP response mapping, and the TanStack Query
rejection adapter remain explicit boundaries. The frontend board creation flow
also retains its handling of partial upload failure so the created board and token
are always preserved. Task is used to compose service operations, rather than to
replace every Result inspection in the application.

The wrapper intentionally exposes a small composition API. It does not expose
True Myth types, add recovery combinators, or change the application's exception
policy.
Reference: [True Myth Task API](https://true-myth.dev/api/task/classes/Task) and
[Task constructors](https://true-myth.dev/api/task/). The installed 9.4.0 source
was used to verify the constructor and callback exception behavior.
