## Context

The SGS application currently has critical bugs and architectural issues:

1. **Timezone Bug**: Dates show 1 day behind due to improper UTC conversion
2. **Missing Field**: The "Número de Siniestro Compañía" from Softseguros is not captured or searchable
3. **UI Confusion**: Financial modules (Reservas) are displayed despite being unused, and bitácora allows editing when it should be read-only
4. **Workflow Desync**: 22 stages/7 states from Softseguros don't synchronize properly, causing claims to display incorrect stages
5. **Wrong Responsible**: The system shows the data entry user instead of the actual stage owner
6. **No Third-Party Access**: Aliado users cannot access the system with filtered views

The application is strictly a **read-only consultation and reporting platform** - no manual data entry should be possible.

## Goals / Non-Goals

**Goals:**

- Fix timezone handling to prevent 1-day date discrepancies
- Add `numero_siniestro_compania` field and search capability
- Remove financial modules and make bitácora read-only
- Add claim status indicators (Finalizado) and export functionality
- Reconfigure DataGrid with 12 specific columns
- Sync 22 workflow stages and 7 states accurately from Softseguros
- Add text-to-stage validation for audit purposes
- Separate "autor" from "responsable" display
- Implement Aliado role with row-level security
- Configure hourly sync during business hours (7:30 AM - 5:30 PM)

**Non-Goals:**

- No changes to Softseguros integration protocol
- No new data entry forms or manual claim creation
- No modification to existing user roles (Admin, User) permissions
- No database schema changes beyond adding one column
- No changes to authentication mechanism

## Decisions

### Decision: Timezone Handling Strategy

**Choice**: Store dates as DATE type (without time) in PostgreSQL, treating all Softseguros dates as local Colombia time (America/Bogota).

**Rationale**:

- Softseguros provides dates without time components
- The bug occurs when JavaScript Date objects are created and converted to UTC, potentially crossing day boundaries
- Using DATE type avoids timezone conversion entirely

**Alternative Considered**: Keep TIMESTAMP with timezone and adjust conversion logic. Rejected because it adds complexity where none is needed.

### Decision: Column Addition vs. Separate Table

**Choice**: Add `numero_siniestro_compania` as a new column on the existing `claims` table.

**Rationale**:

- Simplest solution for a single field
- No normalization concerns with this data
- Easily searchable with existing Supabase queries

**Alternative Considered**: Create separate metadata table. Rejected as over-engineering for one field.

### Decision: Bitácora Read-Only Implementation

**Choice**: Remove input components entirely rather than disabling them.

**Rationale**:

- Clearer UX - no confusion about why input is disabled
- Reduces bundle size by removing unused form components
- Aligns with the read-only platform principle

**Alternative Considered**: Keep inputs disabled. Rejected as it clutters UI and implies future editability.

### Decision: Workflow State Source of Truth

**Choice**: Use the most recent novedad chronologically from Softseguros as the single source of truth.

**Rationale**:

- Softseguros is the authoritative system
- Chronological ordering prevents race conditions
- No local state management needed

**Alternative Considered**: Maintain local state tracking with Softseguros as backup. Rejected as it introduces sync complexity and potential conflicts.

### Decision: Aliado RLS Implementation

**Choice**: Use Supabase Row-Level Security with policies checking `claims.aliado_origen = auth.uid()` or a user metadata field.

**Rationale**:

- Security enforced at database level
- Works automatically for all queries
- No application-level filtering needed

**Alternative Considered**: Filter in application code. Rejected as it relies on developers remembering to filter every query.

### Decision: Export Format

**Choice**: CSV format for bitácora export.

**Rationale**:

- Universal compatibility
- Small file size
- Easy to generate client-side or server-side
- Meets basic reporting needs

**Alternative Considered**: Excel (.xlsx). Rejected to avoid additional dependencies; can be added later if needed.

## Risks / Trade-offs

**Risk**: Breaking UI changes may confuse existing users accustomed to financial fields
→ **Mitigation**: Communicate changes in advance; provide training on read-only nature of system

**Risk**: Workflow sync changes may temporarily display incorrect stages during transition
→ **Mitigation**: Test thoroughly with sample data; verify stage mapping logic before deployment

**Risk**: Aliado RLS policies could accidentally restrict admin access if misconfigured
→ **Mitigation**: Test policies with multiple user types; include admin bypass explicitly

**Risk**: Date changes could affect existing records
→ **Mitigation**: Audit existing dates; plan data correction script if needed

**Risk**: Removing financial fields may break existing reports
→ **Mitigation**: Identify any reports using these fields; update or deprecate accordingly

## Migration Plan

1. **Database Changes** (Phase 1):
   - Add `numero_siniestro_compania` column to claims table
   - Create RLS policies for Aliado role
   - Run migration script to populate new field from existing Softseguros data

2. **Backend Updates** (Phase 2):
   - Update sync service with timezone fix
   - Configure hourly cron schedule
   - Update search endpoint to include new field

3. **Frontend Updates** (Phase 3):
   - Remove financial module components
   - Convert bitácora to read-only timeline
   - Add export button
   - Update DataGrid columns
   - Add Finalizado indicators
   - Implement Aliado role UI

4. **Testing** (Phase 4):
   - Verify date accuracy across all date fields
   - Test workflow stage synchronization
   - Validate Aliado access restrictions
   - Confirm bitácora export functionality

5. **Deployment** (Phase 5):
   - Deploy database changes
   - Deploy backend updates
   - Deploy frontend
   - Monitor sync logs for errors

**Rollback Strategy**:

- Database column addition is non-destructive
- Frontend can be rolled back independently
- Keep old components commented out initially for quick revert
