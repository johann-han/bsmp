# Supabase Persistence

## Purpose

The Study domain remains persistence-agnostic through `StudyRepository`. The web application provides the concrete Supabase adapter; the domain does not import Supabase SDK types.

## Current state

The BSMP Supabase project now contains the first Study persistence schema:

- `studies`
- `study_observations`

Both tables are scoped to `auth.users` through `user_id` and protected by Row Level Security policies.

The web application now contains:

- a browser Supabase client using the publishable key
- generated database types for the Study tables
- `SupabaseStudyRepository`
- a persistent Observation Workspace bootstrap
- email/password sign-in and account creation

## Supabase project

The connected project is `johann-han's BSMP` in `eu-west-1`.

## Environment

Copy `apps/web/.env.example` to `apps/web/.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Never place a Supabase secret/service-role key in browser environment variables or source control.

## Migration

The migration is:

`supabase/migrations/20260812130000_initial_study_persistence.sql`

It has been applied to the connected BSMP Supabase project and the resulting tables have RLS enabled. The Supabase security advisor currently reports no security lints.

## Application flow

`/login` authenticates the user with Supabase Auth. `/workspace` then resolves the authenticated user and loads or creates the user's StudySession through `SupabaseStudyRepository`.

Observation persistence follows:

`StudySession → StudyRepository → Supabase → study_observations`

The repository never uses a service-role key.

## Remaining verification

The local repository still needs `pnpm install` after adding `@supabase/supabase-js`, followed by:

```text
pnpm typecheck
pnpm test
pnpm build
```

An authenticated browser test should then verify:

1. Create an account/sign in.
2. Open `/workspace`.
3. Select a verse.
4. Save an observation.
5. Refresh the page.
6. Confirm the observation remains.
