# Specifications: Implement State Flow Logic

## Context
The application needs to handle the lifecycle of a claim (sinistro) through defined workflow phases. Currently, the states are defined in constants, but the logic to transition between them, record history, and validate changes is likely missing or incomplete in the context/UI.

## Core Requirements

### 1. State Transition Logic
- **Component**: `ClaimsContext`
- **Functionality**:
  - Create a specialized function `changeClaimState(claimId: string, newState: InternalState, author: string)` (or similar).
  - **Validation**: Ensure `newState` is a valid state from `WORKFLOW_PHASES`.
  - **Updates**:
    - Set `estado_interno` to `newState`.
    - Update `lastStateChangeDate` to current timestamp.
    - Add a new entry to `stateHistory` capturing:
      - Previous state (or just the new state transition).
      - Date of transition.
      - Author of the change.
      - Duration of previous state (calculated).

### 2. UI for State Management
- **Component**: `ClaimDetailModal` or similar (wherever claims are edited).
- **Functionality**:
  - Provide a dropdown or selector to change the `estado_interno`.
  - Group states by `WorkflowPhase` for better usability.
  - When a state is changed, prompt for confirmation or optional comment (timeline entry).

### 3. Timeline Integration
- **Functionality**:
  - When state changes, automatically add a "System" or "User" note to the `timeline` array indicating the change: "Estado cambiado de [Old] a [New]".

## Data Model
- `Claim` interface already has `stateHistory` and `lastStateChangeDate`.
- `InternalState` type is defined.

## Acceptance Criteria
- [ ] `ClaimsContext` exposes a `changeClaimState` method.
- [ ] Changing a state updates `lastStateChangeDate`.
- [ ] Changing a state appends to `stateHistory` with correct calculation of days in previous state.
- [ ] Timeline reflects the state change.
- [ ] UI allows selecting any valid state from the `WORKFLOW_PHASES`.
