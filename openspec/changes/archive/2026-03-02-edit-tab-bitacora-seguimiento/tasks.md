## 1. Database Setup

- [x] 1.1 Verificar/crear tabla `timeline` con columnas: `id` (UUID), `claim_id` (UUID), `entry` (TEXT), `created_at` (TIMESTAMP), `created_by` (TEXT)
- [x] 1.2 Verificar nombre exacto del campo de fecha en tabla `claims` (probablemente `proxima_fecha_seguimiento` o `fecha_ultimo_seguimiento`)
- [x] 1.3 Crear función PostgreSQL `update_tracking_with_bitacora()` para transacción atómica (update claim + insert timeline)
- [x] 1.4 Agregar índice en `timeline.claim_id` para optimizar queries

## 2. Service Layer

- [x] 2.1 Crear servicio `src/services/trackingService.ts` con función `saveTrackingUpdate()`
- [x] 2.2 Implementar función para formatear entrada de bitácora: `formatBitacoraEntry(date, userName, status, description)`
- [x] 2.3 Implementar llamada RPC a `update_tracking_with_bitacora` usando Supabase client
- [x] 2.4 Agregar manejo de errores y tipado TypeScript para el servicio
- [x] 2.5 Crear tests unitarios para `formatBitacoraEntry()` (verificar formato exacto) - **SKIPPED: No test framework configured**

## 3. UI Components - Edit Tab

- [x] 3.1 Crear componente `src/components/EditTrackingTab.tsx`
- [x] 3.2 Implementar estado local con `useState` para: estado, próxima fecha, descripción
- [x] 3.3 Agregar efecto `useEffect` para pre-diligenciar formulario con datos del siniestro seleccionado
- [x] 3.4 Crear dropdown de estados usando constante `WORKFLOW_PHASES` de `constants.ts`
- [x] 3.5 Agregar input de fecha tipo date picker (usando input nativo o componente existente)
- [x] 3.6 Agregar textarea para descripción con límite de 2000 caracteres y contador
- [x] 3.7 Implementar validación de fecha: no permitir fechas en el pasado (mostrar error inline)
- [x] 3.8 Estilizar componente con Tailwind siguiendo convenciones del proyecto (slate-800, slate-700, etc.)

## 4. Integration with Claim Detail View

- [x] 4.1 Modificar componente de detalle de siniestro para agregar pestaña "Editar"
- [x] 4.2 Pasar prop `claim` al componente `EditTrackingTab`
- [x] 4.3 Importar `EditTrackingTab` en la vista de detalle
- [x] 4.4 Asegurar que al cambiar de siniestro, el formulario se resetee con nuevos datos

## 5. Save Functionality

- [x] 5.1 Implementar función `handleSave` en `EditTrackingTab` que valide campos antes de enviar
- [x] 5.2 Obtener nombre de usuario desde contexto de autenticación (verificar propiedad: `fullName`, `displayName`, etc.)
- [x] 5.3 Integrar llamada a `trackingService.saveTrackingUpdate()`
- [x] 5.4 Mostrar loading state mientras se guarda
- [x] 5.5 Mostrar mensaje de éxito al completar guardado
- [x] 5.6 Mostrar mensaje de error si falla la operación
- [x] 5.7 Limpiar formulario o mantener valores según decisión de UX

## 6. Timeline/Bitácora Display

- [x] 6.1 Verificar componente existente de bitácora/timeline en la vista de detalle
- [x] 6.2 Asegurar que nuevas entradas aparezcan inmediatamente después de guardar (refresh de datos o actualización optimista)
- [x] 6.3 Verificar que el formato de visualización muestre correctamente las entradas generadas

## 7. Testing & Validation

- [x] 7.1 Test manual: Verificar que pestaña "Editar" aparece en vista de detalle
- [x] 7.2 Test manual: Verificar pre-diligenciamiento de campos con datos del siniestro
- [x] 7.3 Test manual: Guardar cambios y verificar actualización de fecha en claim
- [x] 7.4 Test manual: Verificar creación de entrada en bitácora con formato exacto
- [x] 7.5 Test manual: Verificar validación de fecha (no permite fechas pasadas)
- [x] 7.6 Test manual: Verificar que al fallar una operación, no se guarde parcialmente (atomicidad)
- [x] 7.7 Test edge case: Intentar guardar con descripción vacía
- [x] 7.8 Test edge case: Usuario sin nombre completo (fallback a email)

## 8. Documentation & Cleanup

- [x] 8.1 Agregar JSDoc al servicio `trackingService.ts`
- [x] 8.2 Documentar función PostgreSQL en README o archivo de migraciones
- [x] 8.3 Verificar que no haya console.logs de debugging en código de producción
- [x] 8.4 Verificar tipado TypeScript con `npx tsc --noEmit`
- [x] 8.5 Actualizar AGENTS.md si es necesario con nuevo componente o servicio
