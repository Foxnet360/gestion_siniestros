# Tasks: Smart Ingestion Merge

## Database Schema

### Extend Claims Table
- [x] Add migration file for new columns
  - [x] Add 14 SoftSeguros fields (`numero_siniestro_compania`, `tipo_siniestro`, `fecha_aviso`, `fecha_notificacion_aseguradora`, `proveedor_asignado`, `descripcion`, `documento_asegurado`, `email_principal`, `celular_principal`, `porcentaje_siniestralidad`, `finalizado`, `fecha_finalizacion`, `coaseguros`, `gestion_softseguros`, `estado_gestion_softseguros`)
  - [x] Add 2 calculated fields (`prescripcion_ordinaria`, `prescripcion_extraordinaria`)
  - [x] Add 1 internal field (`proximo_seguimiento`)
  - [x] All columns nullable for backward compatibility

### Create Amparos Table
- [x] Create migration for `amparos` table
  - [x] Add columns: `id` (UUID PK), `claim_id` (FK), `numero_siniestro`, `nombre_reclamante`, `amparo`, `valor`, `created_at`
  - [x] Add foreign key constraint to `claims.id_softseguros` with ON DELETE CASCADE
  - [x] Add index on `claim_id`

### Add Performance Indexes
- [x] Create indexes for merge operations
  - [x] `idx_claims_estado_softseguros` on `claims(estado_softseguros)`
  - [x] `idx_claims_aseguradora` on `claims(aseguradora)`
  - [x] `idx_claims_tecnico` on `claims(tecnico)`
  - [x] `idx_state_history_claim_id` on `state_history(claim_id)`
  - [x] `idx_timeline_claim_id` on `timeline(claim_id)`
  - [x] `idx_amparos_claim_id` on `amparos(claim_id)`


---

## TypeScript Types

### Update Claim Interface
- [x] Add 17 new optional fields to `Claim` interface in `types.ts`
  - [x] SoftSeguros fields (14)
  - [x] Calculated fields (2)
  - [x] Internal field (1)
  - [x] Add JSDoc comments indicating field ownership (SoftSeguros/Internal/Hybrid)

### Create Amparo Interface
- [x] Define `Amparo` interface in `types.ts`
  - [x] Fields: `id`, `claim_id`, `numero_siniestro`, `nombre_reclamante`, `amparo`, `valor`, `created_at`

### Define Field Ownership Constants
- [x] Create `constants.ts` or extend existing
  - [x] `SOFTSEGUROS_OWNED_FIELDS`: array of 24 field names
  - [x] `INTERNAL_ONLY_FIELDS`: array of 9 field names
  - [x] `HYBRID_FIELDS`: array of 2 field names

---

## Merge Service

### Create Merge Service Module
- [x] Create `services/mergeService.ts`

### Implement Claim Merge Function
- [x] `mergeClaimFromExcel(excelRow, existingClaim): Promise<MergeResult>`
  - [x] Handle new claim case: create with all SoftSeguros fields + internal defaults
  - [x] Handle existing claim case: compare SoftSeguros fields, build updates object
  - [x] Return early if no changes detected
  - [x] Call `handleStateChange()` if `estado_softseguros` changed
  - [x] Call `handleUltimoSeguimientoChange()` if `ultimo_seguimiento_raw` changed
  - [x] Apply updates to database
  - [x] Return `MergeResult` with action type and changes

### Implement State Change Handler
- [x] `handleStateChange(claimId, oldState, newState, author): Promise<void>`
  - [x] Query current open `state_history` entry
  - [x] Close it: set `end_date`, calculate `days_duration`
  - [x] Create new `state_history` entry with new state
  - [x] Create system timeline entry: "Estado cambió de X a Y"

### Implement Último Seguimiento Parser
- [x] `parseUltimoSeguimiento(raw): TimelineEntry | null`
  - [x] Define regex pattern for structured format
  - [x] Extract: fecha, funcionario, seguimiento, notas
  - [x] Parse DD/MM/YYYY date format
  - [x] Return structured `TimelineEntry` object
  - [x] Fallback to raw text if pattern doesn't match

### Implement Último Seguimiento Change Handler
- [x] `handleUltimoSeguimientoChange(claimId, newText): Promise<void>`
  - [x] Call `parseUltimoSeguimiento()` to get timeline entry
  - [x] Insert into `timeline` table

### Implement Amparos Merge Function
- [x] `mergeAmparos(claimId, excelAmparos): Promise<AmparosMergeResult>`
  - [x] Fetch existing amparos for claim from database
  - [x] Build maps by composite key (`amparo + nombre_reclamante`)
  - [x] Identify new amparos (in Excel, not in DB) → insert
  - [x] Identify updated amparos (different `valor`) → update
  - [x] Identify deleted amparos (in DB, not in Excel) → delete
  - [x] Execute operations (batch inserts/updates/deletes)
  - [x] Return counts for reporting

### Implement Main Ingestion Function
- [x] `ingestClaims(claims, amparos): Promise<IngestionReport>`
  - [x] Batch process claims (100 per batch)
  - [x] For each claim: fetch existing, merge, track result
  - [x] For each claim: merge amparos
  - [x] Aggregate statistics
  - [x] Return `IngestionReport` with counts and duration

---

## Excel Parser Updates

### Extend Excel Parser
- [x] Update `services/excelParser.ts`
  - [x] Map 17 new fields from Excel columns to claim object
  - [x] Parse "Amparos" sheet into `Amparo[]` array
  - [x] Return both claims and amparos from `processFiles()`

---

## Integration

### Update Ingest Component
- [x] Modify `components/Ingest.tsx`
  - [x] Import `mergeService.ingestClaims()`
  - [x] Replace `setClaims(result.claims)` with `mergeService.ingestClaims(result.claims, result.amparos)`
  - [x] Display detailed `IngestionReport` stats (created/updated/unchanged for claims, inserted/updated/deleted for amparos)

### Update Claims Context
- [x] Modify `context/ClaimsContext.tsx` if needed
  - [x] Ensure context handles new claim fields
  - [x] Add amparos to context if needed for display

---

## Testing

### Unit Tests
- [ ] Test `parseUltimoSeguimiento()`
  - [ ] Valid structured format → correct parsing
  - [ ] Invalid format → fallback to raw text
  - [ ] Edge cases: missing fields, extra whitespace

- [ ] Test `mergeClaimFromExcel()`
  - [ ] New claim → creates with defaults
  - [ ] Existing claim, no changes → returns unchanged
  - [ ] Existing claim, field changes → updates only changed fields
  - [ ] State change → triggers state history + timeline
  - [ ] Último seguimiento change → triggers timeline

- [ ] Test `mergeAmparos()`
  - [ ] New amparos → inserts
  - [ ] Updated valor → updates
  - [ ] Missing amparos → deletes
  - [ ] Composite key matching works correctly

### Integration Tests
- [ ] Test full ingestion flow
  - [ ] Upload Excel with new claims → creates correctly
  - [ ] Upload Excel with updated claims → merges correctly
  - [ ] Upload Excel with unchanged claims → skips updates
  - [ ] Verify state_history entries created
  - [ ] Verify timeline entries created
  - [ ] Verify amparos synced correctly

### Manual Testing
- [ ] Test with real SoftSeguros Excel file
  - [ ] Verify all 17 new fields populated
  - [ ] Verify internal fields preserved after ingestion
  - [ ] Verify state changes generate timeline entries
  - [ ] Verify último seguimiento parsed correctly
  - [ ] Verify amparos table populated
  - [ ] Verify ingestion report accurate

---

## Documentation

### Update README or Docs
- [ ] Document field ownership model
- [ ] Document ingestion process and merge logic
- [ ] Document new `Amparo` type
- [ ] Add examples of ingestion reports

### Code Comments
- [ ] Add JSDoc comments to all new functions
- [ ] Document field ownership in type definitions
- [ ] Add inline comments for complex merge logic
