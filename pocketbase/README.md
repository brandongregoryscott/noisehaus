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

## API behavior assumptions

- All collections are accessed only by `apps/api`.
- Browsers do not authenticate with PocketBase directly.
- Public file access is disabled; `apps/api` issues short-lived file-token URLs.
