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
Controllers decode HTTP input and format responses. Services own access rules,
validation, quota checks, and retry policy. Stores own persistence operations,
record mapping, file transport, and translation of provider errors. Controllers
call services; services call stores. Stores do not call services.

Atomic board/token creation and native cascade deletion belong to persistence.
Services check quota for helpful errors; the database also enforces quota against
concurrent writes. Board-token lookups have no additional business rules and stay
in their store without a pass-through service.
