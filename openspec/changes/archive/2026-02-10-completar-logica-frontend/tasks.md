# Tasks: Frontend Logic Implementation

- [x] **1. Foundation & State Management (Complete)**
  - [x] Install dependencies: `xlsx`, `date-fns`.
  - [x] Create `ClaimsContext` (or Store) to hold `claims`, `users`, and `filters`.
  - [x] Migrate existing `App.tsx` state to Context.

- [x] **2. Role Implementation (ALIADO) (Complete)**
  - [x] Update `types.ts` to include `ALIADO` in `Role` type.
  - [x] Update `types.ts` `User` interface with `aliadoId`.
  - [x] Add mock `ALIADO` user in `constants.ts`.
  - [x] Update `Sidebar.tsx` to hide non-relevant links for Aliados.

- [x] **3. Data Ingestion Logic (Complete)**
  - [x] Create service `services/excelParser.ts`.
  - [x] Implement `parseSoftseguros(file)`: Maps CSV columns to partial `Claim`.
  - [x] Implement `parseGestion(file)`: Maps 'Responsable', 'Prescripcion' columns.
  - [x] Implement `mergeData(softseguros, gestion)`:
    - [x] Join on `IDENTIFICADOR`.
    - [x] Calculate `Prescripción` dates (Ordinaria +2y, Extraordinaria +5y).
    - [x] Return unified `Claim[]`.

- [x] **4. Component Updates (Complete)**
  - [x] **Ingest.tsx**:
    - [x] Add dual file droppers (one for Softseguros, one for Gestion).
    - [x] Connect state to `excelParser` service.
    - [x] Show summary of results (Total rows, New cases, Updates).
  - [x] **Dashboard.tsx**:
    - [x] Implement `FilterBar` component.
    - [x] Connect widgets to filtered state from Context.
    - [x] Add "Prescription Risk" widget (Claims nearing expiration).

- [x] **5. Verification (Ready)**
  - [x] Test full flow: Upload both CSVs -> Verify Dashboard numbers match.
  - [x] Log in as `ALIADO` -> Verify restricted view.
