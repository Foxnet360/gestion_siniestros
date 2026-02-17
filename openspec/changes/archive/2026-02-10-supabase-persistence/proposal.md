# Proposal: Supabase Persistence

## Why
Currently, the application relies on mock data and React state that is lost upon page refresh. To enable real-world use, collaborative management, and reliability, we must implement a persistent backend. Supabase is selected for its rapid prototyping capabilities, built-in Auth, and real-time database features.

## What Changes
We will replace the mock data layer with a real-time connection to a Supabase PostgreSQL database. This involves:
- Installing and configuring the `@supabase/supabase-js` client.
- Creating a database schema that supports the existing claim, history, and timeline structures.
- Refactoring `ClaimsContext` to perform CRUD operations against the Supabase API rather than just local state.

## Capabilities
<!-- Each capability below will require a corresponding spec file in the next phase. -->
- **Database Schema**: SQL definitions for `claims`, `state_history`, and `timeline` tables, including proper indexing and relations.
- **Client Integration**: Configuration of the Supabase client and management of service/anon keys via environment variables.
- **State Synchronization**: Implementation of data fetching, updating, and real-time listening logic within the application's context.

## Impact
- **Dependencies**: New dependency on `@supabase/supabase-js`.
- **ClaimsContext.tsx**: Transitions from a synchronous local state manager to an asynchronous data provider.
- **constants.ts**: Mock data will be moved to a seeding script or deprecated in favor of database data.
- **Environment**: Requirement for `.env` variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).
