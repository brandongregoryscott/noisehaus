# Noisehaus

Noisehaus stores, plays, and shares sounds grouped into boards.

## Language

**Board**:
A named collection of sounds with a slug, view permission, and a shared storage quota.

**Board file**:
A sound stored on one board, including its audio file and display metadata.

**Board token**:
A secret granting write access to its board and read access when that board requires a token.

**Board creation**:
Creating a board together with its initial board token. Uploading initial sounds follows creation and must preserve the created board and token when an upload fails or its outcome is unknown.

## Architecture

Each API feature keeps its controller, service, and store in the same directory.
Filenames include the feature name (for example, `boards/boards-service.ts`),
including tests. Types live in and are exported from the service or store that
owns them. Stores own persistence input/result types; services own access and
business-operation input types. Services may import store types; stores do not
import service types.
Controllers decode HTTP input and format responses. Services own access rules,
validation, quota checks, and retry policy. Stores own persistence operations,
record mapping, file transport, and translation of provider errors. Controllers
call services; services call stores. Stores do not call services.

API stores return `Promise<Result<T, E>>`; services return the application-owned
`Task<T, E>` for expected failures.
Stores use `StoreError`; services add access and business failures through
`ServiceError`. Missing records are successful `null` store results; services
decide whether absence means not found or is allowed (such as feedback without a
matching board). Propagate failures before further reads or writes.
When naming a Result wrapper after a domain value, include the `Result` suffix
(for example, `boardResult` or `quotaResult`); a generic `result` is also clear.
Keep domain names for domain values. Services compose dependent operations with
`Task` from `common`: `andThen` receives successful values and propagates failures;
`map` transforms successful values. Callbacks may return a `Result`, a
`Promise<Result>`, or another `Task`. Service operations and their private
composition helpers return `Task` directly. Controllers await `.toPromise()`
at the HTTP boundary before passing the application Result to `HttpResponse`.
Use `Task.ok(value)` and `Task.err(error)` for immediate outcomes, and
`Task.fromPromise(() => storeOperation())` to start a store operation. Services
chain other services directly. Keep dependent work inside callbacks so it only
starts after prior checks succeed. Use `orElse` for selective recovery such as
confirmed slug-conflict retries. Use `orElseResult` when recovery needs Result
predicates such as `isUniqueConstraintError("slug")`; it receives a known `Err`.
Unexpected exceptions bypass both recovery methods.
See [Task composition](docs/task-composition.md) for examples and exception behavior.

Both apps import the application-owned `Result`, `ok`, `err`, and error classes
from `common`. Only `packages/common/result.ts` and
`packages/common/task.ts` import `true-myth`; their public contracts hide
library types and methods. Use `result.isErr` for any failure and
specific predicates such as `result.isNotFoundError()`,
`result.isValidationError()`, `result.isPersistenceError()`, and
`result.isUniqueConstraintError(field?)` to narrow failures. Shared error types
and `ErrorKind` constants live in `packages/common/errors.ts`; reference those
constants instead of repeating kind strings.

Stores translate PocketBase HTTP and transport failures into typed errors.
The transport can throw at its external I/O boundary; programming errors,
configuration errors, and broken invariants still throw and reach Express's
fallback handler. Controllers pass results to `HttpResponse.ok(response, result)` or
`HttpResponse.created(response, result)` on the static `HttpResponse` class in
`utilities/responses.ts`. Each helper names its success status (200 or 201) and
maps an `Err` through `HttpResponse.error(response, cause)`.
That response-first error method also handles controller decoding failures and
Express's fallback middleware. It owns status mapping, logging, and redaction,
using `response.req.logger` with a fallback logger, and preserves the HTTP
response envelope. Preserve causes for diagnostics, keep validation causes
non-enumerable, and hide provider diagnostics in production HTTP responses.
The board service retries only confirmed slug conflicts.

Frontend request helpers return `Result<T, ApiError>` after decoding the HTTP
envelope, including failures to fetch or parse a response. Hooks use
`toQueryPromise` at the TanStack Query boundary so failures reject and Query
tracks error state. Never put an `Err` into Query's successful data cache.
After board creation, upload failures retain the created board and token;
unknown upload outcomes tell the user to inspect the board before retrying.

Atomic board/token creation and native cascade deletion belong to persistence.
Services check quota for helpful errors; the database also enforces quota against
concurrent writes. Board-token lookups have no additional business rules and stay
in their store without a pass-through service.

## Testing patterns

Separate sibling `it` and `describe` blocks from neighboring statements with a
blank line, including nested suites and parameterized tests.

Keep each test in arrange, act, assert order, with blank lines separating the
three phases, including each iteration of a test-case loop. Set up fixtures and
mocks first, invoke the operation in the act phase, then assert on its outcome.
Keep the main operation out of `expect(...)` calls so the action is visible on
its own.
Result-narrowing `assert(...)` calls belong with the other assertions.

Name the outer `describe` after the class, exported object, or function under test
(for example, `Result`, `BoardsController`, or `errorHandler`). Describe behavior
in nested suites and test names. Descriptive outer names are appropriate for
cross-cutting contracts, migrations, or modules testing several related exports
without one primary subject.

Use standalone tests when cases mock different methods, exercise different
operations, or need different assertions. A case-specific arrange callback is a
signal to split the cases into separate tests rather than abstract their setup.
Use test-case arrays when the setup, operation, and assertions stay the same and
only the data changes. When that data has several properties, use a named
`testCases` array of objects inside one test and iterate with `for...of`. Named
properties make inputs and expected outcomes readable without tracking tuple
positions in `it.each`.
Include the case name or error name in assertion messages to identify failures,
and reset mocks between iterations so call counts and outcomes stay independent.
Simple single-value `it.each` cases can remain parameterized.

Use `assert(result.isOk)`, `assert(result.isErr)`, or a specific result predicate
to narrow results before checking their payload. Avoid conditional assertion
blocks that could skip payload checks.
