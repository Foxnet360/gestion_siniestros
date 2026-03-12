## Context

El sistema SGS actual gestiona siniestros con un campo `proximo_seguimiento` que los usuarios deben calcular y actualizar manualmente. Esto genera inconsistencias y casos olvidados. El sistema carece de:

1. Cálculo automático de fechas basado en reglas de negocio
2. Detección automática de fechas de prescripción legal
3. Alertas progresivas antes de vencimientos críticos
4. Cierre automático por prescripción o estancamiento

Las reglas de negocio actuales son:

- **Fases 1-5**: 10 días entre seguimientos
- **Proceso Jurídico**: 30-60 días (1-2 meses)
- **Prescripción Ordinaria**: 2 años desde fecha de ocurrencia (todos excepto RC)
- **Prescripción Extraordinaria**: 5 años desde fecha de ocurrencia (solo Responsabilidad Civil)
- **Estancamiento Jurídico**: Alerta a 24 meses, cierre automático a 5 años

## Goals / Non-Goals

**Goals:**

- Implementar cálculo automático de `proximo_seguimiento` basado en estado y reglas configurables
- Calcular automáticamente fechas de prescripción al crear/modificar siniestros
- Enviar alertas progresivas (90 días warning, 30 días critical) antes de vencimientos
- Cerrar automáticamente siniestros al vencer prescripción, con registro en bitácora
- Detectar y cerrar casos jurídicos estancados después de 5 años
- Permitir ajuste manual de fechas calculadas por los técnicos
- Almacenar reglas de negocio en base de datos para modificación sin redeploy
- Recalcular fechas automáticamente cuando cambia el estado del siniestro

**Non-Goals:**

- No se modifica el flujo de ingesta de Excel (campos SoftSeguros permanecen igual)
- No se implementa machine learning para predecir tiempos de resolución
- No se envían notificaciones push móviles (solo email y UI)
- No se modifica la lógica de KPIs existentes (change separado)
- No se implementa gestión de calendario hábil/festivos (se usa calendario simple)

## Decisions

### 1. Arquitectura de Configuración: Tabla app_config vs Archivos

**Decision:** Usar tabla `app_config` en Supabase con campos JSONB.

**Rationale:**

- Permite modificar reglas sin redeploy del código
- Auditoría nativa de cambios (updated_at, updated_by)
- Acceso transaccional desde aplicación
- Facilita diferentes configuraciones por ambiente

**Alternativa considerada:** Archivos YAML/JSON en repositorio → descartado por requerir redeploy para cambios.

**Estructura propuesta:**

```sql
app_config (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by VARCHAR(100)
)
```

### 2. Procesamiento de Cierres Automáticos: Edge Function vs Cron Externo

**Decision:** Edge Function de Supabase con cron interno (pg_cron).

**Rationale:**

- Serverless, sin mantenimiento de infraestructura
- Integración nativa con Supabase Auth y RLS
- Pg_cron disponible en Supabase para scheduling
- Logging y monitoreo centralizado

**Alternativa considerada:** Cron job en servidor separado (Node.js) → descartado por complejidad de infraestructura adicional.

### 3. Cálculo de Fechas: Servicio Unificado vs Separado

**Decision:** Dos servicios separados: `FollowUpCalculationService` y `PrescriptionService`.

**Rationale:**

- Separación de responsabilidades claras
- Prescription es más simple (cálculo único al crear)
- Follow-up requiere recálculo frecuente
- Facilita testing independiente

### 4. Alertas: Multi-nivel vs Binario

**Decision:** Tres niveles de alerta con umbrales configurables.

**Rationale:**

- **Normal**: Seguimiento regular
- **Warning** (90 días antes de prescripción): Alerta amarilla, email semanal
- **Critical** (30 días antes): Alerta roja, email diario, notificación inmediata
- Permite priorización por parte de los técnicos

**Umbrales configurables:**

```json
{
  "prescription": {
    "warning": 90,
    "critical": 30,
    "autoClose": 0
  },
  "followUp": {
    "overdue": 1,
    "stagnant": 30
  },
  "legalStagnant": {
    "warningMonths": 24,
    "closeYears": 5
  }
}
```

### 5. Identificación de Responsabilidad Civil: Campo ramo exacto vs Pattern matching

**Decision:** Comparación exacta del campo `ramo` contra lista configurable.

**Rationale:**

- Prediccible y testeable
- Evita falsos positivos
- Lista configurable permite adaptación sin código

**Configuración propuesta:**

```json
{
  "extraordinaryPrescriptionRamos": ["Responsabilidad Civil"]
}
```

### 6. Bitácora de Cierre Automático: Formato estándar vs Extendido

**Decision:** Formato estándar de bitácora con autor "Sistema".

**Rationale:**

- Consistente con entradas manuales
- Facilita auditoría posterior
- Usa mismo formato: `"Fecha: DD/MM/YYYY - Funcionario: Sistema - Seg: "[ESTADO]" [descripción]`"

## Risks / Trade-offs

**[Riesgo] Cierre automático incorrecto de casos importantes**
→ Mitigación: Solo cerrar estados PRESCRIPCIÓN y PROCESO JURÍDICO. Casos con monto > X requieren aprobación manual.

**[Riesgo] Spam de emails de alertas**
→ Mitigación: Configuración granular por usuario. Digest diario agrupa todas las alertas en un solo email. Opt-out disponible.

**[Riesgo] Cambios en reglas de negocio sin validación**
→ Mitigación: Solo usuarios con rol ADMIN pueden modificar app_config. Cambios se auditan automáticamente.

**[Riesgo] Performance de queries diarios de cierre**
→ Mitigación: Índices en `fecha_prescripcion_ordinaria`, `fecha_prescripcion_extraordinaria`, `estado_interno`. Edge function corre en horario de baja demanda (2 AM).

**[Riesgo] Zona horaria incorrecta en cálculos de fechas**
→ Mitigación: Todas las fechas almacenadas en UTC. Cálculos usan librería date-fns con zona horaria de Colombia (America/Bogota).

**[Trade-off] Exactitud legal vs Simplicidad técnica**

- **A favor**: No se implementa calendario hábil completo (festivos, puentes)
- **Contra**: Los plazos legales pueden requerir cálculo en días hábiles
- **Decisión**: Usar días calendario simple. Documentar limitación. Iterar si surge requerimiento legal estricto.

**[Trade-off] Automatización completa vs Control humano**

- **A favor**: Cierre 100% automático reduce carga operativa
- **Contra**: Pierde revisión humana de casos edge
- **Decisión**: Cierre automático solo para casos claros. Casos con prioridad ALTA o monto > umbral requieren aprobación manual (cambia a estado "CIERRE PENDIENTE").

## Migration Plan

### Fase 1: Base de Datos y Configuración

1. Crear tabla `app_config` con registros iniciales
2. Agregar columnas a `claims`: `alert_level`, `fecha_prescripcion_ordinaria`, `fecha_prescripcion_extraordinaria`
3. Crear índices optimizados para queries de alertas
4. Crear Edge Function `process-auto-closures`
5. Configurar cron job en Supabase (2 AM diario)

### Fase 2: Backend Services

1. Implementar `FollowUpCalculationService`
2. Implementar `PrescriptionService`
3. Implementar `AlertService` (email + UI)
4. Implementar `AutoCloseService`
5. Integrar recálculo automático en `trackingService.ts`

### Fase 3: Frontend

1. Modificar `EditTrackingTab.tsx` para mostrar fecha calculada
2. Agregar componentes de alerta en dashboard
3. Crear página de configuración de reglas (solo ADMIN)
4. Agregar preferencias de notificación en perfil de usuario

### Fase 4: Migración de Datos

1. Script para calcular prescripciones de siniestros existentes
2. Script para establecer alertas iniciales basadas en fechas actuales
3. Validación: verificar que todos los siniestros tienen fechas calculadas

### Fase 5: Deploy y Monitoreo

1. Deploy de cambios de base de datos
2. Deploy de Edge Function
3. Ejecutar scripts de migración
4. Deploy de backend y frontend
5. Monitorear logs de cierres automáticos durante 1 semana

### Rollback Strategy

- Soft launch: feature flag `AUTO_FOLLOWUP_ENABLED` (default false)
- Mantener lógica anterior como fallback
- Si hay problemas: deshabilitar feature flag, restaurar lógica manual
- Datos: las fechas calculadas permanecen, el sistema solo deja de recalcular automáticamente

## Open Questions

1. **Umbral de monto para aprobación manual**: ¿Qué monto requiere aprobación de gerente antes de cierre automático? ¿$50M, $100M?

2. **Destinatarios de alertas**: ¿Las alertas van solo al técnico asignado, o también a un supervisor/gerente?

3. **Formato de emails**: ¿Emails simples de texto o templates HTML con branding de SoftSeguros?

4. **Casos jurídicos estancados**: ¿El cierre por estancamiento de 5 años aplica también a casos NO jurídicos que lleven 5 años sin actividad?

5. **Prescripción interrumpida**: ¿Hay casos donde la prescripción se "interrumpe" legalmente (por ejemplo, cuando se presenta demanda) y el plazo se reinicia?

6. **Excepciones de ramo**: ¿Además de "Responsabilidad Civil", hay otros ramos con prescripción extraordinaria de 5 años?
