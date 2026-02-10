# Design: Frontend Logic Implementation

## Architecture Overview

### 1. Data Store (Zustand)
We will transition from `useState` in `App.tsx` to a global store using `zustand`. This is necessary to handle the complexity of:
- Multiple data sources (`Softseguros` vs `Internal`)
- Global filtering
- Computed KPIs

**Store Structure:**
```typescript
interface AppState {
  claims: Claim[];
  users: User[];
  currentUser: User | null;
  filters: FilterState;
  
  // Actions
  setClaims: (claims: Claim[]) => void;
  updateClaim: (claim: Claim) => void;
  setFilters: (filters: FilterState) => void;
  ingestData: (softsegurosData: any[], internalData: any[]) => void;
}
```

### 2. Data Ingestion Service
A dedicated service (`services/dataIngestion.ts`) will handle the parsing and merging logic.
- **Input**: Two Arrays of Objects (from parsing CSVs).
- **Process**:
  1. Index `Gestion 2026` by `IDENTIFICADOR`.
  2. Iterate `Descarga Softseguros`.
  3. Merge attributes.
  4. Calculate Prescriptions.
  5. Return unified `Claim[]`.

### 3. Component Architecture
- **Dashboards**:
  - `DashboardWrapper`: Connects to Store, applies filters, passes filtered data to widgets.
  - `FilterBar`: New component for global filtering.
- **Upload**:
  - `Ingest`: Updated to accept 2 files. Uses `xlsx` to parse and calls `store.ingestData`.

## Implementation Details

### Data Mapping
| Claim Field | Source CSV Column | Logic |
|-------------|-------------------|-------|
| `id_softseguros` | `IDENTIFICADOR` | Primary Key |
| `numero_siniestro` | `NÚMERO DE SINIESTRO` | Direct |
| `responsable` | `Responsable` | From Gestion CSV |
| `fecha_siniestro` | `FECHA DEL SINIESTRO` | Parse Date |
| `prescripcion_ord` | N/A | `fecha_siniestro` + 2y |
| `prescripcion_ext` | N/A | `fecha_siniestro` + 5y |

### Prescription Logic
```typescript
const calculatePrescription = (dateStr: string) => {
  const date = new Date(dateStr);
  return {
    ordinary: addYears(date, 2),
    extraordinary: addYears(date, 5)
  };
}
```

## Dependencies
- `xlsx`: For CSV/Excel parsing.
- `date-fns`: For robust date manipulation (recommended over raw JS Date).
- `zustand`: For checking state management (if not already present, we might stick to React Context if preferred, but Store is cleaner). *Correction: Project uses React. For simplicity in a prototype/single-dev scope, we can stick to a centralized Context or lifted State if adding libraries is restricted, but `zustand` is standard in modern stacks.* 
**Decision**: Stick to **React Context** to minimize external deps if `zustand` isn't already there. We will create `ClaimsContext`.

## Risks / Trade-offs
- **Browser Memory**: Loading large CSVs entirely in memory might be slow. Limit: ~10k rows should be fine.
- **Date Formats**: CSV dates (DD/MM/YYYY vs MM/DD/YYYY) are a common failure point. We need robust parsing.
