## Why

The SGS (Sistema de Gestión de Siniestros) application has critical bugs and architectural misalignments that prevent effective claims tracking. Key issues include timezone bugs causing date discrepancies, missing "Número de Siniestro Compañía" field, UI confusion from editable fields in a read-only system, workflow desynchronization with Softseguros (22 stages/7 states), and lack of row-level security for third-party "Aliado" users.

## What Changes

**FASE 1 - Backend & Synchronization:**

- Configure BOB sync daemon to run hourly during business hours (7:30 AM - 5:30 PM)
- Fix timezone bug causing dates to show 1 day behind (UTC conversion issue)
- Add `numero_siniestro_compania` field mapping from Softseguros (3rd column)
- Update search endpoint to include compañía siniestro number (ILIKE matching)

**FASE 2 - Frontend UI/UX:**

- **BREAKING**: Remove financial module (Reservas) - Monto Pretensión, Deducible, Indemnización Bruta, Neto a Pagar
- **BREAKING**: Convert bitácora from editable chat to read-only timeline (display only Softseguros novedades)
- Add export button for full bitácora with claim/person/company data
- Add "Finalizado" status indicator and completion date to header
- Replace "Técnico" filter with "Número de Póliza" filter (before Ramo filter)
- Reconfigure Master List DataGrid with 12 specific columns (Siniestro, Compañía Siniestro, Tipo, Fecha Siniestro, Fecha Aviso, Fecha Radicación, Proveedor, Póliza, Aseguradora, Ramo, Estado Etapa, Último Seguimiento, Estado Última Gestión, Próximo Seguimiento)

**FASE 3 - Workflow & Logic:**

- Sync 22 workflow stages and 7 states strictly from Softseguros chronological records
- Add text validation to audit if observations match reported stage (e.g., "reconsideración liquidación" belongs to stage 4)
- Separate "autor" (data entry user) from "responsable" (actual stage owner) display

**FASE 4 - Security:**

- Enable "Aliado" user role with Row-Level Security (RLS) based on `aliado_origen` column
- Restrict Aliado users to view only their assigned claims

## Capabilities

### New Capabilities

- `cron-sync-schedule`: Hourly sync configuration during business hours
- `timezone-date-fix`: UTC/local timezone conversion for accurate dates
- `compania-siniestro-field`: Mapping and search for compañía siniestro number
- `claim-detail-refactor`: Read-only UI removal of financial modules and editable bitácora
- `export-bitacora`: Export functionality for timeline data
- `datagrid-columns`: Master list column configuration (12 specific fields)
- `workflow-sync-22-stages`: 22-stage/7-state synchronization from Softseguros
- `workflow-validation`: Text-to-stage validation for audit purposes
- `responsable-display`: Separate author vs responsible party display
- `aliado-rls`: Row-level security for Aliado users based on aliado_origen

### Modified Capabilities

- (none - this is primarily new functionality with breaking UI changes)

## Impact

**Backend:**

- Supabase: Add `numero_siniestro_compania` column to claims table
- Node.js sync service: Timezone handling, hourly cron schedule
- Search API: Extended query with new field

**Frontend:**

- React components: ClaimDetail, FilterBar, ClaimsTable/DataGrid
- Context: Claims filtering logic
- Types: Claim interface updates

**Database:**

- New column: `claims.numero_siniestro_compania`
- RLS policies for Aliado role
- No manual data migration needed (data comes from Softseguros)

**Dependencies:**

- Softseguros API integration (existing)
- Supabase client (existing)
- date-fns (existing for dates)
