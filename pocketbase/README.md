# PocketBase Setup

This project uses PocketBase for database and file storage.

## Local startup

```sh
npm run db:start
```

PocketBase will be available at `http://localhost:8090`.
This command runs native PocketBase migrations (`pocketbase migrate up`) and seeds the admin account (`pocketbase superuser upsert`).

Set `POCKETBASE_URL`, `POCKETBASE_SUPERUSER_EMAIL`, and `POCKETBASE_SUPERUSER_PASSWORD` in `apps/api/.env` before running `db:start`.
Then log into `http://localhost:8090/_/` with the seeded superuser credentials.

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

## Required collections (managed by native migrations)

### `board`

- `name` (`text`, required, min 1, max 256)
- `slug` (`text`, required, min 6, max 64, unique)
- `view_permission` (`select`, required, values: `by_token`, `by_slug`, `public`, default `by_slug`)
- `deleted_at` (`date`, optional)
- `updated_at` (`date`, optional)

### `board_token`

- `board_id` (`text`, required)
- `board_slug` (`text`, required)
- `token` (`text`, required, min 6, max 8, unique)
- `deleted_at` (`date`, optional)
- `updated_at` (`date`, optional)

### `board_file`

- `board_id` (`text`, required)
- `board_slug` (`text`, required)
- `display_name` (`text`, required, min 1)
- `emoji` (`text`, optional)
- `size` (`number`, required, min 0)
- `position` (`number`, optional)
- `sample` (`file`, required, max 1 file)
- `deleted_at` (`date`, optional)
- `updated_at` (`date`, optional)

### `feedback`

- `board_id` (`text`, optional)
- `board_slug` (`text`, optional)
- `email` (`email`, optional)
- `comment` (`text`, required)

## API behavior assumptions

- All collections are accessed only by `apps/api`.
- Browsers do not authenticate with PocketBase directly.
- Public file access is disabled; `apps/api` issues short-lived file-token URLs.
