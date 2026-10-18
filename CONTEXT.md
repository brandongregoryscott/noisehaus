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

Board creation uses the application-owned `Result`, `ok`, and `err` from
`utilities/result.ts` with `Promise<Result<T, StoreError>>` from the store
through the service. Only that wrapper imports `true-myth`; its public contract
exposes application types and hides library methods. Use `result.isErr` for any
failure and `result.isUniqueConstraintError(field?)` for a unique constraint
failure, optionally on a specific field. Both narrow the result so callers can
access its error without another check. Shared application error types, including
`StoreError`, live in `utilities/errors.ts`.

Provider failures become typed results; unexpected
exceptions still reject and reach Express's fallback handler. The service retries
only confirmed slug conflicts. Controllers consume results and send the existing
HTTP response envelope through the shared error-response formatter. Other
operations retain their throwing contracts during this pilot. Error `kind`
getters support narrowing without adding fields to serialized errors.

Atomic board/token creation and native cascade deletion belong to persistence.
Services check quota for helpful errors; the database also enforces quota against
concurrent writes. Board-token lookups have no additional business rules and stay
in their store without a pass-through service.

## Testing patterns

When test data has several properties, use a named `testCases` array of objects
inside one test and iterate with `for...of`. Named properties make inputs and
expected outcomes readable without tracking tuple positions in `it.each`.
Include the case name or error name in assertion messages to identify failures,
and reset mocks between iterations so call counts and outcomes stay independent.
Simple single-value `it.each` cases can remain parameterized.

Use `assert(result.isOk)`, `assert(result.isErr)`, or a specific result predicate
to narrow results before checking their payload. Avoid conditional assertion
blocks that could skip payload checks.
