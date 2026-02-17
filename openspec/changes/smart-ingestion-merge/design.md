# Design: Smart Ingestion Merge

## Context

The current ingestion system uses a simple "replace all" strategy where Excel data completely overwrites existing database records. This was acceptable for initial development but breaks down in production where users manage claims internally (assigning technicians, setting priorities, scheduling follow-ups). Every CRM sync wipes out this internal work.

The system has three data sources:
1. **SoftSeguros CRM** (Excel export) - External source of truth for claim details
2. **Supabase Database** - Our persistence layer and operational source of truth
3. **User Input** - Internal management data (assignments, priorities, notes)

We need to reconcile these sources intelligently, preserving user work while staying synchronized with CRM updates.

## Goals / Non-Goals

**Goals:**
- Preserve all internal management data during CRM ingestion
- Update only fields that have actually changed in SoftSeguros
- Automatically generate audit trail (timeline) for state changes
- Capture all SoftSeguros fields (currently missing 17 fields)
- Apply same smart merge logic to amparos (coverage) data
- Maintain performance for large datasets (1000+ claims)

**Non-Goals:**
- Bi-directional sync (SoftSeguros → Supabase only, not reverse)
- Real-time sync (remains batch/manual upload)
- Conflict resolution UI (system makes deterministic decisions based on field ownership)
- Historical versioning of all field changes (only state changes tracked in state_history)

## Decisions

### Decision 1: Field Ownership Model

**Approach**: Classify every claim field into one of three categories:

| Category | Count | Update Strategy | Examples |
|----------|-------|----------------|----------|
| **SoftSeguros-owned** | 24 | Always update from Excel | `poliza`, `asegurado`, `estado_softseguros`, `monto_reclamo` |
| **Internal-only** | 9 | Never touch during ingestion | `tecnico`, `prioridad`, `proximo_seguimiento`, `estado_interno` |
| **Hybrid** | 2 | Special logic from Gestión sheet | `gestion_softseguros`, `estado_gestion_softseguros` |

**Rationale**: Clear ownership prevents accidental data loss and makes merge logic deterministic. SoftSeguros owns claim facts (who, what, when, how much), while internal system owns workflow state (who's handling it, what's next, how urgent).

**Implementation**: 
- Create constant arrays in code defining each category
- Merge function iterates only over SoftSeguros-owned fields
- TypeScript types annotated with JSDoc comments indicating ownership

### Decision 2: Change Detection Strategy

**Approach**: Compare field-by-field using strict equality (`===`) before updating.

```typescript
const updates: Partial<Claim> = {};
for (const field of SOFTSEGUROS_OWNED_FIELDS) {
  if (excelRow[field] !== existingClaim[field]) {
    updates[field] = excelRow[field];
  }
}
if (Object.keys(updates).length === 0) {
  return { action: 'unchanged' };
}
```

**Rationale**: 
- Minimizes database writes (only update when necessary)
- Provides accurate reporting (new vs updated vs unchanged)
- Avoids unnecessary trigger executions (state change handlers)

**Alternative Considered**: Always update all SoftSeguros fields regardless of changes.
- **Rejected**: Wastes database I/O, makes reporting inaccurate, triggers unnecessary side effects

### Decision 3: State Change Automation

**Approach**: When `estado_softseguros` changes, automatically:
1. Close current `state_history` entry (set `end_date`, calculate `days_duration`)
2. Create new `state_history` entry with new state
3. Generate system timeline entry: "Estado cambió de X a Y"

**Rationale**: 
- Ensures state history is always complete and accurate
- Provides automatic audit trail without manual intervention
- Enables time-in-state analytics for KPIs

**Implementation**:
- Detect state change in merge function
- Call `handleStateChange()` helper before applying updates
- Use database transaction to ensure atomicity

### Decision 4: Último Seguimiento Parsing

**Approach**: Parse the structured format with regex, fall back to raw text if pattern doesn't match.

**Pattern**: `Fecha: DD/MM/YYYY - Funcionario: [name] - Seguimiento: "[state]" [notes]`

**Rationale**:
- Preserves valuable timeline data from CRM
- Gracefully handles format variations (doesn't break on unexpected input)
- Maintains chronological accuracy (uses actual date from CRM, not ingestion date)

**Alternative Considered**: Store raw text only, don't parse.
- **Rejected**: Loses structured data, makes timeline less useful, harder to query

### Decision 5: Amparos Merge Strategy

**Approach**: Use composite key (`amparo + nombre_reclamante`) to identify unique amparos, then:
- **New**: Insert
- **Existing with changed valor**: Update
- **Missing from Excel**: Delete

**Rationale**:
- Amparos are CRM-owned data (not user-managed), so full sync is appropriate
- Composite key handles cases where same coverage type appears multiple times for different claimants
- Deletion ensures database reflects current CRM state

**Alternative Considered**: Never delete, only insert/update.
- **Rejected**: Would accumulate stale amparos over time if CRM removes them

### Decision 6: Database Schema Extensions

**Approach**: Add 17 missing columns to `claims` table, create new `amparos` table, add performance indexes.

**New Columns**:
- SoftSeguros fields: `numero_siniestro_compania`, `tipo_siniestro`, `fecha_aviso`, `descripcion`, etc. (14 fields)
- Calculated fields: `prescripcion_ordinaria`, `prescripcion_extraordinaria` (auto-calculated from `fecha_siniestro`)
- Internal fields: `proximo_seguimiento` (1 field)

**New Table**: `amparos` with FK to `claims.id_softseguros` (ON DELETE CASCADE)

**Indexes**:
```sql
CREATE INDEX idx_claims_estado_softseguros ON claims(estado_softseguros);
CREATE INDEX idx_claims_tecnico ON claims(tecnico);
CREATE INDEX idx_amparos_claim_id ON amparos(claim_id);
```

**Rationale**:
- All columns nullable to support backward compatibility
- Indexes on frequently filtered/joined fields improve query performance
- Cascade delete maintains referential integrity

### Decision 7: TypeScript Type Updates

**Approach**: Extend `Claim` interface with new fields, create new `Amparo` interface.

```typescript
export interface Amparo {
  id: string;
  claim_id: string;
  numero_siniestro: string;
  nombre_reclamante: string;
  amparo: string;
  valor: number;
  created_at: string;
}

export interface Claim {
  // ... existing fields
  // New SoftSeguros fields
  numero_siniestro_compania?: string;
  tipo_siniestro?: string;
  // ... (15 more)
}
```

**Rationale**:
- Optional fields (`?`) for backward compatibility
- Separate `Amparo` interface for type safety
- Matches database schema exactly

### Decision 8: Service Architecture

**Approach**: Refactor ingestion into modular services:

```
services/
├── excelParser.ts          # Parse Excel → typed objects
├── mergeService.ts         # NEW: Smart merge logic
│   ├── mergeClaimFromExcel()
│   ├── mergeAmparos()
│   ├── handleStateChange()
│   └── parseUltimoSeguimiento()
└── supabaseClient.ts       # Database operations
```

**Rationale**:
- Separation of concerns (parsing vs merging vs persistence)
- Testable in isolation
- Reusable merge logic (could be used for API updates too)

### Decision 9: Performance Optimization

**Approach**: Batch processing for large datasets.

```typescript
const BATCH_SIZE = 100;
for (let i = 0; i < claims.length; i += BATCH_SIZE) {
  const batch = claims.slice(i, i + BATCH_SIZE);
  await Promise.all(batch.map(claim => mergeClaim(claim)));
}
```

**Rationale**:
- Parallel processing within batches improves throughput
- Batch size (100) balances memory usage vs performance
- Prevents timeout on large ingestions (1000+ claims)

**Alternative Considered**: Process sequentially.
- **Rejected**: Too slow for large datasets (10+ minutes for 1000 claims)

### Decision 10: Ingestion Reporting

**Approach**: Return detailed statistics object:

```typescript
interface IngestionReport {
  claims: {
    created: number;
    updated: number;
    unchanged: number;
  };
  amparos: {
    inserted: number;
    updated: number;
    deleted: number;
  };
  duration_ms: number;
}
```

**Rationale**:
- Provides visibility into what changed
- Helps detect issues (e.g., all claims "unchanged" might indicate parsing problem)
- Enables analytics on ingestion patterns

## Architecture

### Data Flow

```
┌──────────────┐
│ Excel Files  │
│ - Siniestros │
│ - Amparos    │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│  excelParser.ts  │
│  Parse & Validate│
└──────┬───────────┘
       │
       ▼
┌─────────────────────────────────────┐
│      mergeService.ts                │
│                                     │
│  For each claim:                    │
│  1. Fetch existing by IDENTIFICADOR │
│  2. Compare SoftSeguros fields      │
│  3. Detect state change?            │
│  4. Detect último seg change?       │
│  5. Build update object             │
│  6. Merge amparos                   │
└──────┬──────────────────────────────┘
       │
       ▼
┌──────────────────┐
│ Supabase DB      │
│ - claims         │
│ - amparos        │
│ - state_history  │
│ - timeline       │
└──────────────────┘
```

### Component Interactions

```
Ingest Component (UI)
    │
    ├─ Upload files
    │
    ▼
excelParser.processFiles()
    │
    ├─ Parse Siniestros sheet → Claim[]
    ├─ Parse Amparos sheet → Amparo[]
    │
    ▼
mergeService.ingestClaims()
    │
    ├─ For each claim:
    │   │
    │   ├─ supabase.from('claims').select().eq('id_softseguros', ...)
    │   │
    │   ├─ mergeClaimFromExcel()
    │   │   ├─ Compare fields
    │   │   ├─ handleStateChange() if needed
    │   │   └─ handleUltimoSeguimientoChange() if needed
    │   │
    │   └─ mergeAmparos()
    │       ├─ supabase.from('amparos').select().eq('claim_id', ...)
    │       ├─ Diff Excel vs DB
    │       └─ Insert/Update/Delete
    │
    └─ Return IngestionReport
```

## Risks / Trade-offs

### Risk 1: Field Ownership Misclassification
**Risk**: If we incorrectly classify a field as "internal-only" when it should be "SoftSeguros-owned", we'll miss CRM updates.

**Mitigation**: 
- Document field ownership clearly in code comments
- Add validation tests that verify field counts match expected totals
- Review with domain experts (users who know which fields CRM controls)

### Risk 2: Último Seguimiento Parsing Failures
**Risk**: Regex pattern might not match all format variations, losing timeline data.

**Mitigation**:
- Fallback to raw text storage (no data loss, just less structured)
- Log parsing failures for monitoring
- Iterate on regex pattern based on real data

### Risk 3: Performance Degradation on Very Large Datasets
**Risk**: Batch processing might still be too slow for 5000+ claims.

**Mitigation**:
- Current batch approach should handle up to ~2000 claims reasonably
- If needed, can add progress UI and background processing
- Monitor ingestion duration metrics

### Risk 4: Database Migration Complexity
**Risk**: Adding 17 columns to existing table could cause downtime or data issues.

**Mitigation**:
- All new columns are nullable (no data required)
- Use Supabase migrations (atomic, rollback-able)
- Test migration on staging environment first

### Trade-off 1: Amparos Deletion
**Decision**: Delete amparos missing from Excel.

**Trade-off**: If CRM temporarily loses amparo data, we'll delete it from our DB.

**Justification**: CRM is source of truth for amparos. If data is missing, it's likely intentional (coverage removed). Users don't manually edit amparos, so no risk of losing user work.

### Trade-off 2: No Conflict Resolution UI
**Decision**: System makes deterministic decisions based on field ownership.

**Trade-off**: Users can't override merge behavior on a case-by-case basis.

**Justification**: Adds significant complexity for minimal benefit. Field ownership model handles 99% of cases correctly. Edge cases can be manually fixed post-ingestion.

### Trade-off 3: Synchronous Ingestion
**Decision**: Ingestion blocks UI until complete.

**Trade-off**: User must wait for ingestion to finish (potentially 30-60 seconds for large files).

**Justification**: Simpler implementation, easier error handling. Background processing adds complexity (job queue, status polling, error notifications). Current dataset sizes don't justify the complexity.
