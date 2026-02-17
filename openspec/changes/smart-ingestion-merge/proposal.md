# Proposal: Smart Ingestion Merge

## Why

Currently, the data ingestion process from SoftSeguros CRM performs a **full replacement** of claim data, which causes critical problems:

1. **Loss of Internal Management Data**: When Excel files are ingested, all internal fields (técnico asignado, prioridad, próximo seguimiento, etc.) are overwritten or lost
2. **No Change Detection**: The system doesn't distinguish between new claims, updated claims, and unchanged claims
3. **Missing Business Logic**: State changes don't automatically generate timeline entries for audit trails
4. **Incomplete Data Model**: 17 fields from SoftSeguros Excel are not captured in the database
5. **Lost Context**: The "Último Seguimiento" field contains valuable timeline information but isn't parsed or preserved

**Business Impact**: Teams lose their internal workflow state, priority assignments, and follow-up schedules every time they sync with the CRM. This forces manual re-entry of management data and breaks the audit trail.

## What Changes

Implement an **intelligent merge strategy** that treats Supabase as the source of truth while selectively updating only the fields that changed in SoftSeguros CRM.

### Core Changes

1. **Field Ownership Model**: Classify all claim fields into three categories:
   - 🔄 **SoftSeguros-owned** (24 fields): Always update from Excel
   - 🔒 **Internal-only** (9 fields): Never modified by ingestion
   - 🔀 **Hybrid** (2 fields): Special merge logic

2. **Smart Merge Algorithm**: 
   - Compare incoming Excel data with existing database records by `IDENTIFICADOR`
   - Update only fields that have actually changed
   - Preserve all internal management data

3. **Automatic Timeline Generation**:
   - When `estado_softseguros` changes → auto-create timeline entry
   - When `estado_softseguros` changes → close current state_history entry and create new one
   - Parse "Último Seguimiento" field and append to timeline

4. **Complete Data Model**:
   - Add 17 missing fields to capture full SoftSeguros data
   - Add `amparos` table with intelligent merge logic
   - Add calculated fields (prescripción ordinaria/extraordinaria)

## Capabilities

### New Capabilities

- `smart-merge-ingestion`: Intelligent data merge engine that preserves internal state while updating CRM changes, with automatic timeline generation and field ownership enforcement

### Modified Capabilities

- `database-schema`: Extend with 17 missing SoftSeguros fields, new `amparos` table, field ownership metadata, and calculated prescription dates

## Impact

### Database Changes
- **Schema alterations**: Add 17 new columns to `claims` table
- **New table**: Create `amparos` table with foreign key to claims
- **Indexes**: Add indexes for performance on merge operations

### Code Changes
- **TypeScript types**: Update `Claim` interface, add `Amparo` interface
- **Excel parser**: Refactor to support field classification and change detection
- **Ingestion service**: Implement merge algorithm with state change detection
- **State management**: Add hooks for automatic timeline generation

### Data Migration
- Existing claims will gain new nullable columns
- No data loss - purely additive schema changes
- Backward compatible with current data

### User Experience
- **Preserved work**: Internal assignments and priorities survive ingestion
- **Audit trail**: Automatic timeline entries for all state changes
- **Complete data**: All SoftSeguros fields now captured and queryable
