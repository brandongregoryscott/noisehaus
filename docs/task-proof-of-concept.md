# Task proof of concept

This prototype uses True Myth 9.4.0 behind an application-owned `Task<T, E>` in
`packages/common/task.ts`. It changes three board-file service operations:
`bulkInsert`, `delete`, and the private `getWritableFile` helper. Other operations
retain `async`/`await` so both styles remain available for comparison. This is an
experiment, not an application-wide migration decision.

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

The prototype expresses that sequence as:

```ts
return Task.fromPromise(() => getWritableFile(id, boardSlug, token))
    .andThen((boardFile) => BoardFilesStore.delete(boardFile.id))
    .map(() => true as const)
    .toPromise();
```

`andThen` receives the successful value and only starts its callback after the
preceding operation succeeds. It accepts an application Result, a promise of one,
or another application Task. Error types accumulate as a union. `map` changes a
successful value. Both skip their callbacks after a failure. The `boardFile`
variable is the actual file, so there is no need for a wrapper variable or `.value`.

`bulkInsert` demonstrates the less obvious tradeoff: authorization supplies a
board that is needed after the quota check. The chain nests to retain that board
in scope. The original early returns have a flatter layout. Task removes repeated
checks here, but does not clearly improve every aspect of readability.

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
- The prototype adds no retries, parallel writes, cancellation, or timeout policy.
  Authorization, ownership checks, and quota checks still precede writes.

## Assessment

The clearest benefit is a short linear dependency chain such as deletion or
"authorize, then load". Existing `Promise<Result>` stores can participate without
being migrated. Branch-heavy business logic and sequences that retain several
intermediate values may remain clearer with `async`/`await`.

That benefit requires maintaining a small adapter: Result conversion, composition,
and preservation of the application's exception boundary. Before expanding this
pattern, compare the three changed operations in review and decide whether the
removed checks justify another abstraction. This prototype intentionally omits
recovery combinators and the rest of the True Myth Task API.

Reference: [True Myth Task API](https://true-myth.dev/api/task/classes/Task) and
[Task constructors](https://true-myth.dev/api/task/). The installed 9.4.0 source
was used to verify the constructor and callback exception behavior.
