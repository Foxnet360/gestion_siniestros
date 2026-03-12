## Why

El sistema actual requiere que los usuarios calculen manualmente las fechas de próximo seguimiento para cada siniestro, lo que genera inconsistencias y casos olvidados. Además, no existe un mecanismo automático para detectar cuando un siniestro debe cerrarse por prescripción (2 años ordinarios, 5 años extraordinarios para Responsabilidad Civil), ni para alertar cuando se acercan estas fechas críticas. Este sistema automatizará el cálculo de fechas basado en reglas de negocio configurables, enviará alertas progresivas y cerrará casos automáticamente al vencer los plazos legales.

## What Changes

- **Nueva tabla `app_config`** en Supabase para almacenar reglas de negocio configurables sin necesidad de redeploy
- **Servicio `FollowUpCalculationService`** que calcula automáticamente `proximo_seguimiento` basado en:
  - Estado actual del workflow (10 días estándar, 30-60 días para jurídico)
  - Tipo de ramo (2 años ordinarios, 5 años extraordinarios para RC)
  - Fecha de último seguimiento o cambio de estado
- **Servicio `PrescriptionService`** que calcula y monitorea fechas de prescripción
- **Sistema de alertas multi-canal** (UI, email, digest diario) con niveles: normal, warning (90 días antes), critical (30 días antes)
- **Cierre automático por prescripción** con registro en bitácora del sistema
- **Cierre por estancamiento jurídico** (24 meses alerta, 5 años cierre automático)
- **Recálculo automático** de fechas cuando cambia el estado del siniestro
- **Edge Function o Cron Job** para procesar cierres automáticos diariamente
- **Modificación del componente `EditTrackingTab`** para mostrar fechas calculadas automáticamente (editables por el usuario)
- **Nuevos campos en `Claim`**: alert_level, fecha_prescripcion_ordinaria, fecha_prescripcion_extraordinaria
- **BREAKING**: Cambio en el flujo de seguimiento - el sistema sugiere fechas automáticamente en lugar de default fijo de 7 días

## Capabilities

### New Capabilities

- `follow-up-calculation`: Cálculo automático de fechas de próximo seguimiento basado en reglas configurables por estado y fase del workflow
- `prescription-management`: Gestión de fechas de prescripción ordinaria (2 años) y extraordinaria (5 años para RC), con cierre automático al vencer
- `configurable-business-rules`: Sistema de reglas almacenadas en base de datos (app_config) para modificar comportamiento sin redeploy
- `multi-channel-alerts`: Sistema de alertas progresivas en UI, email y digest diario según proximidad a fechas críticas
- `auto-close-expired`: Cierre automático de siniestros por prescripción o estancamiento jurídico con bitácora del sistema
- `legal-stagnation`: Lógica específica para detectar y cerrar casos jurídicos estancados (24 meses alerta, 5 años cierre)

### Modified Capabilities

- `claim-tracking`: Modifica el cálculo de fechas de seguimiento para usar reglas dinámicas en lugar de default fijo de 7 días. El usuario aún puede ajustar manualmente la fecha calculada.

## Impact

**Base de Datos:**

- Nueva tabla `app_config` (JSONB flexible)
- Nuevos campos en tabla `claims`: `alert_level`, `fecha_prescripcion_ordinaria`, `fecha_prescripcion_extraordinaria`
- Índices adicionales para queries de alertas y cierres automáticos

**Backend:**

- Nuevo servicio `services/followUpCalculationService.ts`
- Nuevo servicio `services/prescriptionService.ts`
- Nuevo servicio `services/alertService.ts` (UI + email)
- Edge Function Supabase para procesamiento diario de cierres
- Modificación de `trackingService.ts` para integrar cálculo automático

**Frontend:**

- Modificación `EditTrackingTab.tsx` para mostrar fecha calculada automáticamente
- Nuevos componentes de alerta en dashboard y detalle de siniestro
- Configuración de notificaciones en perfil de usuario

**Sistema:**

- Dependencia de servicio de email (SendGrid/AWS SES)
- Configuración de cron/scheduler en Supabase
- Migración de datos existentes para calcular prescripciones retrospectivamente

**Usuarios:**

- Los técnicos verán fechas sugeridas automáticamente
- Los gerentes recibirán alertas de casos críticos
- Los admins pueden modificar reglas de negocio sin desarrollador
