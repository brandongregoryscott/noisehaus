<h1 align="center">noisehaus</h1>

<p align="center">
   <a href="https://github.com/brandongregoryscott/noisehaus/actions">
        <img src="https://github.com/brandongregoryscott/noisehaus/actions/workflows/build.yml/badge.svg">
    </a>
    <a href="https://github.com/prettier/prettier">
        <img alt="code style: prettier" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square"/>
    </a>
    <a href="http://www.typescriptlang.org/">
        <img alt="TypeScript" src="https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg"/>
    </a>
</p>

A web application for storing, playing, and sharing sounds. Create your own board today: [https://noise.haus](https://noise.haus)

## Development

This is a monorepo powered by [Turborepo](https://turborepo.dev/) which primarily contains an API and web project.

- [apps/api](./apps/api/) - [ExpressJS](https://expressjs.com/) API server which powers the frontend. [PocketBase](https://pocketbase.io/) is used for the database and audio file storage.
- [apps/web](./apps/web/) - React SPA powered by [Tanstack Start](https://tanstack.com/start)

```sh
# Copy environment files and fill in their values as needed (see note below about PocketBase)
cp apps/api/.env.sample apps/api/.env
cp apps/web/.env.sample apps/web/.env

# Ensure you're on the correct node version
nvm use

# Install packages
npm install

# Start PocketBase (apply migrations, seed admin)
npm run db:start

# Run the development servers for the web app and API
npm run dev

# Now, open http://localhost:3000 in your browser to view the app.
```

To run the full stack locally, set `POCKETBASE_SUPERUSER_EMAIL` and `POCKETBASE_SUPERUSER_PASSWORD` in `apps/api/.env` ([example](./apps/api/.env.sample)). `POCKETBASE_URL` is optional: the native API defaults to `http://127.0.0.1:3435` (the published PocketBase port), and the API Docker image defaults to `http://pocketbase:8090` on the Compose network. Set `POCKETBASE_URL` in the environment or `apps/api/.env` to override either default; omit it to use the default. `db:start` uses those credentials to upsert the PocketBase admin account. For full setup details and collection definitions, see `pocketbase/README.md`.

## Issues

If you find a bug, feel free to [open up an issue](https://github.com/brandongregoryscott/noisehaus/issues/new) and try to describe it in detail with reproduction steps if possible.

If you would like to see a feature, and it isn't [already documented](https://github.com/brandongregoryscott/noisehaus/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement), feel free to open up a new issue and describe the desired behavior.

## API route convention

Application routes are unversioned and start at the API origin, without an `/api` prefix. `GET /health` returns HTTP 200 with `{ "ok": true }`. Previous application paths have been removed; deploy the matching API and frontend builds together.

The health check includes authenticated PocketBase connectivity with a three-second timeout; failure returns HTTP 503 with `{ "ok": false }`. PocketBase retains its native `/api` routes for storage, authentication, and files.

## API metrics

The API exposes Prometheus metrics on a separate listener at
`http://127.0.0.1:9464/metrics` for native development. Configure it with
`METRICS_HOST` and `METRICS_PORT`; use a different port when running multiple APIs
natively on one machine. The public API port does not expose `/metrics`.

Metrics match Bingo's contract: `http_request_duration_seconds` histogram with
`method`, `route`, and `status_code` labels, using the same latency buckets.
Its `_count` series provides request counts. Routes are registered templates;
unmatched and early-rejected requests use `__unmatched__`. Labels never contain
raw URLs, board slugs, file IDs, query strings, or tokens. Health probes are
excluded. Node process metrics include memory, CPU, event loop lag, and GC.

The production Compose file joins the shared external `observability` network
with alias `noisehaus-api-metrics`, binding metrics internally on port 9464.
Deploy the [shared observability stack](https://github.com/brandongregoryscott/observability)
first so the network exists. The automatically loaded local override creates its
own isolated network and does not require that stack. No metrics host port is
published, and neither public tunnel forwards the metrics listener.

After merging and deploying this API, add the following entry to
`prometheus/targets/apis.yml` in the observability repository and redeploy that
stack:

```yaml
- targets: ["noisehaus-api-metrics:9464"]
  labels:
      service: noisehaus-api
      environment: production
```

The existing **API overview** dashboard and alert rules then cover Noisehaus.
Service and environment labels are assigned by Prometheus's target configuration.
