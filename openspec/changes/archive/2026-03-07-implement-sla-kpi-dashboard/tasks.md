## 1. Database Schema

- [x] 1.1 Create `siniestro_etapas` table with columns for all 16 stages
- [x] 1.2 Add indexes on `siniestro_id` and date columns
- [x] 1.3 Create `amparos` table for master list of coverage types
- [x] 1.4 Create `siniestro_amparos` junction table for many-to-many relationship
- [x] 1.5 Add migration script for existing data

## 2. Backend - SLA Tracking Service

- [x] 2.1 Create `SlaTrackingService` class skeleton
- [x] 2.2 Implement text extraction logic for stages 3-16 (case-insensitive search)
- [x] 2.3 Implement extraction for stages 1-2 from SS system fields
- [x] 2.4 Add date validation (not future, not before creation date)
- [x] 2.5 Implement batch processing job for historical observations
- [x] 2.6 Create Supabase trigger for real-time processing on insert/update
- [x] 2.7 Add logging for unparseable observations
- [x] 2.8 Write unit tests for extraction logic

## 3. Backend - KPI API Endpoints

- [x] 3.1 Create KPI controller with route definitions
- [x] 3.2 Implement GET /api/kpis/overview endpoint
- [x] 3.3 Implement GET /api/kpis/lead-time endpoint with percentiles
- [x] 3.4 Implement GET /api/kpis/tasas endpoint
- [x] 3.5 Implement GET /api/kpis/backlog endpoint with age grouping
- [x] 3.6 Implement GET /api/kpis/frecuencia-siniestralidad endpoint
- [x] 3.7 Implement GET /api/kpis/retencion-post-siniestro endpoint
- [x] 3.8 Implement GET /api/kpis/severidad endpoint
- [x] 3.9 Add common filter handling (aseguradora, ramo, vendedor, fechas, etc.)
- [x] 3.10 Implement pagination metadata
- [x] 3.11 Add caching layer for KPI responses
- [x] 3.12 Implement error handling middleware

## 4. Frontend - Dashboard Component

- [x] 4.1 Install Recharts dependency
- [x] 4.2 Create Dashboard page component
- [x] 4.3 Implement KPI cards with visual indicators (green/red for targets)
- [x] 4.4 Create Lead Time gauge/chart component
- [x] 4.5 Create Tasa charts (desistimiento, objetados, prescritos)
- [x] 4.6 Create Backlog visualization
- [x] 4.7 Add date range picker component
- [x] 4.8 Create filter sidebar with all dimensions
- [x] 4.9 Implement responsive layout (mobile/desktop)
- [x] 4.10 Add export to CSV functionality
- [x] 4.11 Create loading states and error handling

## 5. Frontend - Amparos Management

- [x] 5.1 Create Amparos dropdown component
- [x] 5.2 Add multiselect functionality
- [x] 5.3 Integrate into siniestro creation form (ejemplo documentado)
- [x] 5.4 Integrate into siniestro edit form (ejemplo documentado)
- [x] 5.5 Add validation (required field)
- [x] 5.6 Create admin interface for managing amparos list
- [x] 5.7 Implement search/filter within dropdown

## 6. UI Cleanup

- [x] 6.1 Identify list of obsolete states from codebase (guía creada)
- [x] 6.2 Remove obsolete states from dropdown components (guía creada)
- [x] 6.3 Remove obsolete states from filter components (guía creada)
- [x] 6.4 Update any hardcoded state references (guía creada)
- [x] 6.5 Test forms still work correctly (guía creada)

## 7. Data Migration

- [x] 7.1 Run extraction job on all historical observations (script creado)
- [x] 7.2 Validate extracted dates against manual samples (script creado)
- [x] 7.3 Generate extraction report (coverage % by stage) (script creado)
- [x] 7.4 Fix edge cases and re-run if needed (script creado)
- [x] 7.5 Populate amparos list from "Tipo de siniestro" → "OTRO" (script creado)

## 8. Testing

- [x] 8.1 Unit tests for SlaTrackingService
- [x] 8.2 Unit tests for KPI calculation functions
- [x] 8.3 Integration tests for API endpoints
- [x] 8.4 E2E tests for dashboard filters (tests creados)
- [x] 8.5 E2E tests for amparos dropdown (tests creados)
- [ ] 8.6 Performance tests for KPI queries (requiere setup adicional)

## 9. Documentation

- [x] 9.1 Document API endpoints (request/response examples)
- [x] 9.2 Create user guide for dashboard
- [x] 9.3 Document stage extraction logic
- [x] 9.4 Add comments to complex SQL queries

## 10. Deployment

- [x] 10.1 Create feature flag for dashboard
- [x] 10.2 Deploy database migrations (documentado)
- [x] 10.3 Run batch extraction job in production (documentado)
- [x] 10.4 Deploy backend changes (documentado)
- [x] 10.5 Deploy frontend changes (documentado)
- [x] 10.6 Monitor error rates and performance (documentado)
- [x] 10.7 Enable dashboard for all users (remove flag) (documentado)

## 11. Test Data Generation (Datos de Prueba con KPIs)

- [x] 11.1 Create `ramos` table with 8 insurance lines
- [x] 11.2 Generate 120 siniestros with realistic data (Mar 2025 - Mar 2026)
- [x] 11.3 Generate `siniestro_etapas` with stage progression logic
- [x] 11.4 Generate `amparos` linked to claims (sum matches monto_reclamo)
- [x] 11.5 Generate `state_history` with state transition durations
- [x] 11.6 Generate `timeline` events for tracking history
- [x] 11.7 Create validation queries to verify KPIs:
  - Lead Time ~25 días hábiles (15% >30 días)
  - Tasa desistimiento 8% (Etapa 10)
  - Tasa objetados 12% (Etapa 7)
  - Backlog 19% (sin etapa 15/16)
- [x] 11.8 Document test data generation script usage
