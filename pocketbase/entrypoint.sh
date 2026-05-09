#!/bin/sh
set -e

/usr/local/bin/pocketbase --dir=/pb_data --migrationsDir=/pb_migrations superuser upsert "$POCKETBASE_SUPERUSER_EMAIL" "$POCKETBASE_SUPERUSER_PASSWORD"

exec /usr/local/bin/pocketbase serve --http=0.0.0.0:8090 --dir=/pb_data --migrationsDir=/pb_migrations
