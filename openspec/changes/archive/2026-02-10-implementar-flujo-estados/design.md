# Design: Implement State Flow Logic

## Architecture Overview

### 1. Claims Context (`ClaimsContext.tsx`)
We will extend the existing `ClaimsContext` to include state management logic.
- **New Action**: `changeClaimState(claimId: string, newState: InternalState, author: string)`
- **Responsibility**:
  - Validate transition (ensure `newState` is valid).
  - Update `claim.estado_interno`.
  - Update `claim.lastStateChangeDate`.
  - Append to `claim.stateHistory`.
  - Append to `claim.timeline` (System note).

### 2. UI Components
- **Claim Detail Modal/Page**:
  - Add a "Change State" dropdown or control.
  - Group options by `WorkflowPhase` (using `WORKFLOW_PHASES` constant).
  - Hide current state from options (or show as disabled).

## Data Flow
1. User selects new state in UI.
2. Component calls `changeClaimState(id, state, currentUser.name)`.
3. Context updates state and calculates:
   - `daysDuration` for the previous state logic (diff between now and last change).
4. UI re-renders with new state and updated history/timeline.

## Detailed Logic

### `changeClaimState`
```typescript
const changeClaimState = (claimId: string, newState: InternalState, author: string) => {
  setClaims(prev => prev.map(claim => {
    if (claim.id_softseguros !== claimId) return claim;

    const now = new Date();
    const lastChange = claim.lastStateChangeDate ? new Date(claim.lastStateChangeDate) : new Date(claim.updatedAt);
    
    // Calculate duration of previous state
    const daysDuration = Math.ceil((now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24));

    // Create history entry
    const newHistoryEntry: StateHistoryEntry = {
      state: claim.estado_interno, // The state we are leaving
      startDate: lastChange.toISOString(),
      endDate: now.toISOString(),
      daysDuration,
      author: claim.tecnico_asignado // or previous author? Maybe just system/user
    };

    // Create timeline entry
    const timelineEntry: TimelineEntry = {
      id: crypto.randomUUID(),
      date: now.toISOString(),
      author: 'Sistema',
      text: `Estado cambiado de ${claim.estado_interno} a ${newState} por ${author}`,
      isSystem: true
    };

    return {
      ...claim,
      estado_interno: newState,
      lastStateChangeDate: now.toISOString(),
      stateHistory: [...(claim.stateHistory || []), newHistoryEntry],
      timeline: [timelineEntry, ...(claim.timeline || [])],
      updatedAt: now.toISOString()
    };
  }));
};
```

## Considerations
- **Mock Data Persistence**: Since we are using local state (`useState` in Context), changes will be lost on refresh. This is acceptable for the prototype phase as per project context.
- **Validation**: Strict type checking with `InternalState` ensures only valid states are used.
