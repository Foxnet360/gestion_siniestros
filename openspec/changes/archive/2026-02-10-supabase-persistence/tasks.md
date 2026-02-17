# Tasks: Supabase Persistence

## 1. Setup & Configuration

- [x] 1.1 Install `@supabase/supabase-js`.
- [x] 1.2 Create/Update `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- [x] 1.3 Create `lib/supabase.ts` and initialize the client.

## 2. Database Schema Implementation

- [x] 2.1 Create `claims` table in Supabase SQL editor.
- [x] 2.2 Create `state_history` table with FK to `claims`.
- [x] 2.3 Create `timeline` table with FK to `claims`.

## 3. Core Logic Refactor

- [x] 3.1 Update `ClaimsContext.tsx` to fetch all claims from Supabase on load (`useEffect`).
- [x] 3.2 Update `updateClaim` to persist changes to the `claims` table.
- [x] 3.3 Update `changeClaimState` to:
    - Update `claims.estado_interno` and `claims.lastStateChangeDate`.
    - Insert new record into `state_history`.
    - Insert new record into `timeline`.

## 4. Verification & Cleanup

- [ ] 4.1 Verify that refreshing the page retains changes made to claims and states.
- [ ] 4.2 Verify that the Dashboard reflects data fetched from Supabase.
- [x] 4.3 (Optional) Seed the database with initial mock data to verify table structures.
