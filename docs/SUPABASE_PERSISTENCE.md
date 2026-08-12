# Supabase Persistence

## Purpose

The Study domain remains persistence-agnostic through `StudyRepository`. The web application must provide the concrete Supabase adapter; the domain must not import Supabase SDK types.

## Current state

The repository currently has no Supabase client, authentication integration, or generated database types. The Study workspace therefore continues to use the in-memory repository for development.

This migration defines the first persistence contract for:

- `studies`
- `study_observations`

Both tables are scoped to `auth.users` through `user_id` and protected by Row Level Security policies.

## Migration

Apply:

`supabase/migrations/20260812130000_initial_study_persistence.sql`

## Required application work before switching production bootstrap

1. Add the Supabase client dependency to the web application.
2. Add browser-safe and server-only client creation according to the authentication flow.
3. Introduce the Supabase implementation of `StudyRepository` outside the Study domain package.
4. Resolve the authenticated `user_id` before constructing the repository.
5. Replace the development in-memory bootstrap only after authentication and repository tests pass.
6. Add integration tests for RLS and round-trip study/observation persistence.

No service-role key should be exposed to browser code.
