# PocketBase Migration Plan

This document defines the implementation plan to migrate `noisehaus` from Supabase to PocketBase with no automated data migration.

## Goals

- Keep the current product behavior (no user signup/login).
- Keep the current API contract used by `apps/web`.
- Move database and file storage to a self-hosted PocketBase instance.
- Remove Supabase runtime dependency from the API.

## Non-Goals

- No historical data migration.
- No client-side PocketBase access from the browser.
- No auth model changes for board access tokens.

## Phase 1: Infrastructure + Client

1. Add PocketBase environment variables:
   - `POCKETBASE_URL`
   - `POCKETBASE_SUPERUSER_EMAIL`
   - `POCKETBASE_SUPERUSER_PASSWORD`
2. Add a PocketBase HTTP client module for:
   - superuser auth
   - CRUD helpers for collections
   - file URL/token helpers
3. Switch healthcheck to use PocketBase instead of Supabase.

### Exit Criteria

- API boots with PocketBase env vars only.
- Healthcheck succeeds with a reachable PocketBase.

## Phase 2: Store Migration

1. Migrate `BoardsStore` and `BoardTokensStore` to PocketBase filters/records.
2. Migrate `FeedbackStore` to PocketBase records.
3. Migrate `BoardFilesStore` to PocketBase records with file fields and signed URLs.
4. Remove API runtime usage of Supabase client and query-builder calls.

### Exit Criteria

- Board create/read/update/delete still works.
- Board token authorization behavior is unchanged.
- File upload/list/update/delete still works.
- Feedback create still works.

## Phase 3: Type Decoupling

1. Replace shared entity types derived from `packages/common/generated/database.ts` with explicit domain types.
2. Update API store and endpoint types to depend on explicit domain types.

### Exit Criteria

- No runtime code depends on Supabase-generated DB types.

## Phase 4: Tests + Tooling + Docs

1. Replace Supabase-specific mocks with PocketBase client mocks in API tests.
2. Update README/local dev instructions for PocketBase.
3. Replace/remove Supabase CLI scripts and Supabase metadata folder.
4. Remove Supabase dependencies after migration is complete.

### Exit Criteria

- Existing API tests pass with PocketBase mocks.
- README reflects PocketBase setup path.
- Supabase is no longer required to run the project.
