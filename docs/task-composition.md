# Task composition

API services use an application-owned `Task<T, E>` backed by True Myth 9.4.0.
The adapter lives in `packages/common/task.ts`. Stores continue to return
`Promise<Result<T, E>>`; services return `Task<T, E>` and compose other services
directly. Controllers convert to `Promise<Result<T, E>>` at the HTTP boundary.

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
    .map(() => true as const);
```

`andThen` receives the successful value and only starts its callback after the
preceding operation succeeds. It accepts an application Result, a promise of one,
or another application Task. Error types accumulate as a union. `map` changes a
successful value. Both skip their callbacks after a failure. The `boardFile`
variable is the actual file, so there is no need for a wrapper variable or `.value`.

All service operations and their composition helpers return Task directly.
Calls between services chain without wrapping them again. Immediate outcomes use
`Task.ok(value)` or `Task.err(error)` rather than converting through a Result.
Result-returning callbacks can still use `ok(value)` and `err(error)`. For example, an upload checks capacity
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
- Controllers call `.toPromise()` before passing a Result to `HttpResponse.ok`
  or `HttpResponse.created`. For example:

    ```ts
    const boardResult = await BoardsService.get(slug, token).toPromise();
    return HttpResponse.ok(response, boardResult);
    ```

    The application adapter deliberately is not directly awaitable; use
    `.toPromise()` in tests and other consumers that need to inspect the Result.
    Awaiting a raw True Myth Task would expose its own Result rather than our error
    predicates.

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

`orElse` receives an expected error and can return a Result, a promise of one, or
another Task. Successful values pass through without invoking recovery. A failure
from recovery replaces the original error type. Unexpected exceptions bypass all
recovery callbacks and still reject when converted at the controller boundary.

`orElseResult` provides the same recovery behavior with an application `Err<E>`
instead of the raw error. This preserves Result predicates in recovery callbacks:

```ts
.orElseResult((result) => {
    if (result.isUniqueConstraintError("slug") && attempt < MAX_CREATE_ATTEMPTS) {
        return insert({ ...options, attempt: attempt + 1 });
    }
    return result;
})
```

Board creation uses this method to retry only confirmed slug conflicts, with the
existing attempt limit. A general automatic retry would be unsafe for writes with
an ambiguous outcome.

Transport error translation, HTTP response mapping, and the TanStack Query
rejection adapter remain explicit boundaries. The frontend board creation flow
also retains its handling of partial upload failure so the created board and token
are always preserved. Task is used to compose service operations, rather than to
replace every Result inspection in the application.

The wrapper exposes a small composition API and hides True Myth types. Its
`ok`, `err`, `andThen`, `map`, `orElse`, and `orElseResult` methods retain the application's
exception policy while avoiding conversions between service calls.
Reference: [True Myth Task API](https://true-myth.dev/api/task/classes/Task) and
[Task constructors](https://true-myth.dev/api/task/). The installed 9.4.0 source
was used to verify the constructor and callback exception behavior.
