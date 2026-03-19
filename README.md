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

- [apps/api](./apps/api/) - [ExpressJS](https://expressjs.com/) API server which powers the frontend. [Supabase](https://supabase.com/) is used for the database/ORM and audio file storage.
- [apps/web](./apps/web/) - React SPA powered by [Tanstack Start](https://tanstack.com/start)

```sh
# Copy environment files and fill in their values as needed (see note below about Supabase)
cp apps/api/.env.sample apps/api.env
cp apps/web/.env.sample apps/web.env

# Ensure you're on the correct node version
nvm use

# Install packages
npm install

# Apply migrations to the remote database
npm run db:migrate:remote

# Run the development servers for the web app and API
npm run dev

# Now, open http://localhost:3000 in your browser to view the app.
```

To run the full stack locally, you'll need to create a free Supabase project and copy the URL and service role key to `apps/api/.env` ([example](./apps/api/.env.sample)). You'll also want to install the [Supabase CLI](https://www.npmjs.com/package/supabase) to easily connect to the project and run migrations. It's installed in the root `package.json`, so you should be able to run `npx supabase` to verify.

## Issues

If you find a bug, feel free to [open up an issue](https://github.com/brandongregoryscott/noisehaus/issues/new) and try to describe it in detail with reproduction steps if possible.

If you would like to see a feature, and it isn't [already documented](https://github.com/brandongregoryscott/noisehaus/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement), feel free to open up a new issue and describe the desired behavior.
