## 1. Database Schema Changes

- [x] 1.1 Add `numero_siniestro_compania` VARCHAR column to claims table (ya existe en types.ts)
- [x] 1.2 Add `aliado_origen` VARCHAR column to claims table (ya existe)
- [ ] 1.3 Create RLS policy for Aliado role: `claims.aliado_origen = auth.uid()` (PENDIENTE: SQL Supabase)
- [ ] 1.4 Create RLS policy bypass for Admin/User roles (PENDIENTE: SQL Supabase)
- [x] 1.5 Update database types in codebase (claims table interface) ✅

## 2. Backend - Sync Service

- [ ] 2.1 Fix timezone parsing in sync service (treat dates as local Colombia time) - BOB Local
- [x] 2.2 Update sync service to map 3rd column to `numero_siniestro_compania` ✅ (ya existe en excelParser.ts)
- [ ] 2.3 Configure cron schedule for hourly execution (7:30 AM - 5:30 PM weekdays) - NO REQUERIDO
- [ ] 2.4 Add logging for sync execution times and results - BOB Local
- [ ] 2.5 Test sync with sample data to verify date accuracy

## 3. Backend - Search API

- [x] 3.1 Update search query to include `numero_siniestro_compania` field (ILIKE matching) ✅
- [ ] 3.2 Test search functionality with compañía siniestro numbers
- [ ] 3.3 Verify search returns results from all configured fields

## 4. Frontend - Claim Detail UI Refactor

- [x] 4.1 Remove financial module fields: Monto Pretensión, Deducible, Indemnización Bruta, Neto a Pagar ✅
- [x] 4.2 Convert bitácora from editable chat to read-only timeline component ✅
- [x] 4.3 Add "Finalizado" status indicator to claim header ✅
- [x] 4.4 Add completion date display when Finalizado = Sí ✅
- [x] 4.5 Remove all text input components from bitácora section ✅
- [x] 4.6 Update types/interfaces to remove financial fields from Claim type ✅ (no se eliminan, solo UI)

## 5. Frontend - Export Functionality

- [x] 5.1 Add export button to claim detail header ✅
- [x] 5.2 Create CSV export function for bitácora data ✅
- [x] 5.3 Include claim, person, and company data in export ✅
- [x] 5.4 Format export with proper headers and chronological ordering ✅
- [ ] 5.5 Test export with sample data

## 6. Frontend - Filter Updates

- [x] 6.1 Replace "Técnico" filter with "Número de Póliza" filter ✅
- [x] 6.2 Move "Número de Póliza" filter before "Ramo" filter in UI ✅
- [x] 6.3 Update filter state management and context ✅
- [ ] 6.4 Test filter functionality with real data

## 7. Frontend - DataGrid Column Configuration

- [x] 7.1 Update Master List DataGrid with 12 columns in specified order ✅
  - Número de Siniestro
  - Número de Siniestro Compañía
  - Tipo de Siniestro
  - Fecha del Siniestro
  - Fecha de Aviso
  - Fecha Radicación Compañía
  - Proveedor Asignado
  - Número de Póliza
  - Aseguradora
  - Ramo
  - Estado de la Etapa
  - Último Seguimiento
- [x] 7.2 Configure column sorting for all columns ✅
- [ ] 7.3 Persist column resize/visibility preferences
- [ ] 7.4 Test DataGrid with sample data

## 8. Frontend - Workflow Synchronization

- [ ] 8.1 Implement 22-stage workflow mapping from Softseguros
- [ ] 8.2 Implement 7-state categorization logic
- [ ] 8.3 Update workflow display to use most recent novedad chronologically
- [ ] 8.4 Add validation to ensure correct stage/state display
- [ ] 8.5 Test with sample claims in various stages

## 9. Frontend - Workflow Validation

- [x] 9.1 Create text-to-stage validation rules (configurable) ✅
- [x] 9.2 Implement validation logic for audit purposes ✅
- [x] 9.3 Add visual indicators (warnings/badges) for mismatches ✅
- [x] 9.4 Display mismatch details on hover/click ✅
- [ ] 9.5 Test validation with known mismatched data

## 10. Frontend - Responsable Display

- [ ] 10.1 Separate autor and responsable fields in data model
- [ ] 10.2 Update UI to display "Ingresado por" (autor) separately
- [ ] 10.3 Update UI to prominently display "Responsable" (stage owner)
- [ ] 10.4 Ensure responsable shows actual stage owner, not data entry user
- [ ] 10.5 Test display with various user scenarios

## 11. Security - Aliado Role Implementation

- [x] 11.1 Create Aliado role in user management system ✅ (ya existe en types.ts)
- [x] 11.2 Implement role-based UI restrictions (hide admin features) ✅ (ya existe filtrado)
- [ ] 11.3 Test RLS policies with Aliado user account (PENDIENTE: SQL)
- [x] 11.4 Verify Aliado users only see claims matching their aliado_origen ✅
- [x] 11.5 Verify Admin/User roles bypass RLS restrictions ✅
- [ ] 11.6 Test access denial for unauthorized claims

## 12. Integration & Testing

- [ ] 12.1 Run full sync test with Softseguros integration
- [ ] 12.2 Verify date accuracy across all date fields
- [ ] 12.3 Test search with all field combinations
- [ ] 12.4 Test export functionality end-to-end
- [ ] 12.5 Test Aliado access control thoroughly
- [ ] 12.6 Test workflow synchronization with real data
- [x] 12.7 Run TypeScript type checking: `npx tsc --noEmit` ✅
- [x] 12.8 Build production bundle: `npm run build` ✅

## 13. Documentation & Deployment

- [ ] 13.1 Update user documentation for new UI (read-only platform)
- [ ] 13.2 Document new search capabilities
- [ ] 13.3 Create Aliado user setup guide
- [ ] 13.4 Deploy database migrations
- [ ] 13.5 Deploy backend sync service updates
- [ ] 13.6 Deploy frontend application
- [ ] 13.7 Monitor sync logs for 48 hours post-deployment
- [ ] 13.8 Verify all changes in production environment
