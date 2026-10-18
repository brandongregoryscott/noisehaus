# PocketBase Setup

This project uses PocketBase for database and file storage.

## Local startup

```sh
npm run db:start
```

PocketBase will be available at `http://localhost:3435`.
This command runs native PocketBase migrations (`pocketbase migrate up`) and seeds the admin account (`pocketbase superuser upsert`).

Set `POCKETBASE_SUPERUSER_EMAIL` and `POCKETBASE_SUPERUSER_PASSWORD` in `apps/api/.env` before running `db:start`. `POCKETBASE_URL` is optional: native API defaults to `http://127.0.0.1:3435`; its Docker image defaults to `http://pocketbase:8090`. An explicit environment value overrides the default.
Then log into `http://localhost:3435/_/` with the seeded superuser credentials.

Stop the local instance:

```sh
npm run db:stop
```

## Schema source of truth

Native PocketBase migration files in `pocketbase/migrations/` are the source of truth.

```sh
npm run db:migrations:up
```

Seed or rotate the superuser password:

```sh
npm run db:superuser:seed
```

This command reads credentials from `apps/api/.env`.

If login fails with a `500` after changing setup paths, reset the local PocketBase data and bootstrap again:

```sh
npm run db:stop
rm -rf pocketbase/data
npm run db:start
```

Create a new migration:

```sh
npm run db:migrations:new -- <migration_name>
```

Generate collection snapshot migration from current PocketBase state:

```sh
npm run db:migrations:collections
```

After creating/updating migrations, commit the new files in `pocketbase/migrations/`.

Migration regression tests are plain JavaScript `*.test.mjs` files next to their migration and run with the API tests. PocketBase's migration loader only matches `.js` and `.ts` files, so it skips these tests during startup. Vitest and Prettier support `.mjs` without extra transformation or formatting configuration.

## API behavior assumptions

- All collections are accessed only by `apps/api`.
- Browsers do not authenticate with PocketBase directly.
- Public file access is disabled; `apps/api` issues short-lived file-token URLs.

## Board consistency

Apply `1792278000_board_consistency.js` before deploying the matching application build. It enables PocketBase batches, turns on cascading deletion for board files, tokens, and feedback, and installs SQLite quota triggers.

- Board creation writes the board and its initial token in one transaction. Slug collisions retry the entire transaction.
- Each upload writes all its board files in one transaction. A rejected file rolls back the other files in that upload.
- Deleting a board delegates to PocketBase's transactional cascade. A failed deletion retains the board and its token together.
- The database rejects inserts and size increases exceeding the board's 10 MiB quota, including concurrent uploads and replacements. The application still checks remaining capacity before writing to give a useful error message. Quota calculations include every page of existing files.
- After a successful board-creation response, the browser retains the board and token for every initial-upload outcome. An unconfirmed upload directs the user to inspect the board before trying again.

The quota triggers use the same limit as `MAXIMUM_BOARD_SIZE_IN_BYTES` in `packages/common/constants/files.ts`. Change both through a migration if the quota changes. Recreate the triggers after any later migration that rebuilds the `boardFiles` table; SQLite drops a table's triggers when that table is dropped. Stored file sizes are supplied by the upload module from the received file, rather than accepted from the browser.

Rolling back this migration removes the quota triggers, restores the previous relation settings, and disables batches. These persistence guarantees must be preserved if the database implementation changes. PocketBase's [batch processing](https://pocketbase.io/docs/api-records/#batch-createupsertupdatedelete-records) and [transaction handling](https://pocketbase.io/docs/js-records/#transaction) define the atomic behavior used here.

A lost response to board creation itself remains an unknown outcome; the application does not automatically retry it. Recovering that case would require a durable creation identifier retained by the browser. Database rollback also cannot guarantee immediate cleanup of audio bytes in external file storage after a process failure.
