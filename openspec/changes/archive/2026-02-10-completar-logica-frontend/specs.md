# Specifications: Frontend Logic Completion

## Context
The current application is a high-fidelity prototype with mock data. To meet business rules, we need to implement actual logic for data ingestion, user roles, and reporting.

## Core Requirements

### 1. User Roles (Rule 2)
- **New Role**: `ALIADO`
- **Permissions**:
  - `ADMIN`: Full access (same as current).
  - `TECNICO`: Can edit assigned cases (same as current).
  - `ALIADO`: 
    - Read-only access to cases where `entidad_aliado` matches their organization.
    - Can upload "Soportes" (documents) but not change state.
    - Restricted view in Dashboard (only their own kpis).

### 2. Data Ingestion (Rule 4)
- **Sources**:
  1. `Descarga Softseguros.csv`: Source of truth for Policy/Claim info.
  2. `Gestion 2026.csv`: Internal tracking sheet with extended columns.
- **Processing Logic**:
  - **Synchronization**:
    - Master Key: `IDENTIFICADOR` (common to both files).
    - **Softseguros Update**:
      - Read `Descarga Softseguros.csv`.
      - Create/Update records based on `IDENTIFICADOR`.
      - Map core fields (Siniestro, Póliza, Asegurado, etc.).
    - **Internal Data Merge**:
      - Read `Gestion 2026.csv`.
      - Merge internal fields: `Responsable`, `Estado Ultima Gestion`, `Proximo Seguimiento`.
      - **Prescription Logic**:
        - Calculate `Prescripción Ordinaria`: `Fecha Siniestro` + 2 years.
        - Calculate `Prescripción Extraordinaria`: `Fecha Siniestro` + 5 years.
        - *Note*: These fields exist in the CSV but should be auto-calculated/validated if missing.
  - **Persistence**: Hybrid approach.
    - Frontend loads both files to build the "Current State".
    - Changes made in app (e.g., adding a document) should be exportable/saveable.

### 5. Reportes y Filtros (Rule 5)
- **Filters**:
  - Add filters matching the columns: `Responsable`, `Estado`, `Aseguradora`, `Ramo`.
  - Dashboard must show "Days to Prescription" warnings based on the calculated dates.

## Data Model Changes
```typescript
// types.ts updates

export type Role = 'ADMIN' | 'TECNICO' | 'ALIADO';

export interface User {
  // ... existing
  aliadoId?: string; // Link to specific Ally organization
}

export interface Claim {
  // ... existing
  aliado_origen?: string; // Organization that owns/referred the policy
}
```

## Acceptance Criteria
- [ ] `ALIADO` role exists and restricts view.
- [ ] Uploading an Excel file parses real data and updates the state.
- [ ] Re-uploading the same file causes no changes.
- [ ] Re-uploading a modified file updates only the changed fields.
- [ ] Dashboard filters update all charts and tables simultaneously.
