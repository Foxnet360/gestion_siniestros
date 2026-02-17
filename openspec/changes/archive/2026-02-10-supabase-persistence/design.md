# Design: Supabase Persistence

## Context
The application currently manages all state in-memory via `ClaimsContext` initialized with mock data. This design moves that state management to a cloud PostgreSQL database provided by Supabase.

## Goals / Non-Goals

**Goals:**
- Persist all claim data, state history, and timeline events in Supabase.
- Maintain existing TypeScript interfaces and logic flow in the UI.
- Implement a centralized Supabase client for all database interactions.
- Ensure seamless data fetching on application load.

**Non-Goals:**
- Implementing multi-tenancy in this phase (focus on single-org persistence).
- Implementing full auth (will use service role or anon keys for now, auth comes in a later change).
- Modifying the Dashboard UI logic (only the data source changes).

## Decisions

### 1. Technology Choice: `@supabase/supabase-js`
We will use the official Supabase JavaScript library. It provides a clean, type-safe API for interacting with PostgreSQL and handles connection pooling/REST mapping automatically.

### 2. Initialization: `lib/supabase.ts`
A new utility file will be created to initialize the Supabase client once per application lifecycle. Keys will be stored in `.env` variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

### 3. Context Refactor: `ClaimsContext.tsx`
The `ClaimsContext` will be updated to:
- Use `useEffect` to fetch data from Supabase on mount.
- Transition `updateClaim` and `changeClaimState` to asynchronous functions that first persist to Supabase and then update local state (optimistic updates where applicable).
- Standardize on `id_softseguros` as the primary key for data lookups.

### 4. Data Mapping
We will ensure that the database column names (snake_case) map cleanly to the CamelCase TypeScript interfaces. We may use a mapping utility or standard aliases in SQL queries.

## Risks / Trade-offs
- **Network Latency**: Moving to a remote DB introduces latency compared to local state. We will use optimistic UI updates for state changes to mitigate this.
- **Environment Security**: Exposing the Anon key is standard for frontend apps, but we must ensure Row Level Security (RLS) is eventually configured to protect data.
