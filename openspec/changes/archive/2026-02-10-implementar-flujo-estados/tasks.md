# Tasks: Implement State Flow Logic

- [x] **1. Context & Logic Implementation**
  - [x] Implement `changeClaimState` function in `ClaimsContext.tsx`.
    - [x] Validate valid state transitions.
    - [x] Calculate duration of previous state.
    - [x] Update `stateHistory` and `timeline`.
    - [x] Update `lastStateChangeDate`.
  - [x] Update `types.ts` if `StateHistoryEntry` needs any new fields (e.g. `author` is missing or different).

- [x] **2. UI Implementation**
  - [x] Create/Update `ClaimDetailModal` (or equivalent view where claims are edited).
  - [x] Add "Cambiar Estado" dropdown/action.
    - [x] Group states by `WorkflowPhase` for usability.
    - [x] Current state should be disabled or highlighted.
    - [x] Add confirmation dialog (optional but recommended for critical actions).

- [x] **3. Verification**
  - [x] Verify state change updates the Dashboard "Status" column immediately.
  - [x] Verify `Timeline` shows the automatic system message.
  - [x] Verify `stateHistory` records the transition correctly.
  - [x] Check "Prescription Risk" logic still works with new state updates (it relies on `lastStateChangeDate` or `fecha_ocurrencia`).
