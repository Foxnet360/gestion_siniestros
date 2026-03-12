## Context

El sistema de gestión de siniestros actualmente mide Lead Time global (promedio de 24.5 días entre Aviso y Pago) a través del servicio `KpiService.ts`. Este cálculo se basa en las tablas `claims` (con campos `fecha_aviso` y `fecha_finalizacion`) y `siniestro_etapas` (con fechas de 16 etapas).

Los datos históricos de seguimientos se almacenan en:

- `claim_history`: Auditoría de cambios en campos como observaciones
- `ultimo_seguimiento_raw`: Campo de texto con historial de seguimientos
- `siniestro_etapas`: Fechas extraídas de observaciones por keyword para cada una de las 16 etapas

La arquitectura actual utiliza Supabase (PostgreSQL) para persistencia, React para el frontend, y un servicio centralizado `KpiService.ts` que realiza cálculos directamente en el cliente. No hay proceso batch automatizado ni caché de métricas agregadas.

Los tipos de proceso varían significativamente:

- **Procesos normales**: 30-90 días (aviso → pago)
- **Prescripción ordinaria**: ~2 años (etapa 13 de espera)
- **Prescripción extraordinaria**: ~5 años (etapa 13 extendida)

Esta variabilidad hace que un Lead Time promedio global sea engañoso y no permita identificar cuellos de botella operativos específicos.

## Goals / Non-Goals

**Goals:**

- Crear sistema de métricas granular por cada una de las 16 etapas del proceso
- Calcular frecuencia de seguimiento basada en actualizaciones del campo observaciones
- Implementar segmentación por aseguradora, ramo, técnico, rango de valor y tipo de proceso
- Usar percentil P90 como métrica principal (no promedio) para representar experiencia del 90% de casos
- Excluir siniestros con datos incompletos del KPI principal, mostrando indicador visible de exclusiones
- Calcular días hábiles reales considerando fines de semana y feriados colombianos
- Identificar automáticamente cuellos de botella operativos

**Non-Goals:**

- Modificar la estructura existente de `siniestro_etapas` o `claims`
- Crear sistema de alertas en tiempo real (fuera de scope, podría ser fase 2)
- Machine learning para predicción de tiempos (futuro)
- Integración con sistemas externos de aseguradoras
- Mobile app para visualización

## Decisions

### 1. Arquitectura: Procesamiento Batch + Tablas de Métricas

**Decision:** Crear tablas separadas (`metricas_etapas`, `kpis_etapas_agregados`) para almacenar métricas calculadas en lugar de calcular en tiempo real.

**Rationale:**

- Consultas complejas con múltiples JOINs y cálculos de percentiles serían lentas en tiempo real
- Miles de registros históricos requieren procesamiento intensivo (una sola vez)
- Una vez calculadas, las métricas son estáticas (datos históricos no cambian)
- Permite caché y respuesta rápida en dashboard

**Alternatives considered:**

- _Calcular en tiempo real_: Rechazado por lentitud con grandes volúmenes de datos
- _Materialized views de PostgreSQL_: Considerado pero menos flexible para lógica compleja de negocio (clasificación de tipo de proceso, validaciones)

### 2. Cálculo de Frecuencia: Usar claim_history (no parsing de texto)

**Decision:** Contar seguimientos usando registros de auditoría en `claim_history` donde campo = 'observaciones', en lugar de parsear `ultimo_seguimiento_raw`.

**Rationale:**

- `claim_history` ya tiene estructura definida con timestamps precisos
- Evita inconsistencias por formato variable del campo texto
- Mejor performance (índices existentes en claim_history)
- Más confiable para auditoría

**Trade-off:** Si hay seguimientos registrados antes de implementar `claim_history`, se perderán. Se acepta esta limitación para datos nuevos en adelante.

### 3. Exclusión de Datos: Estricta pero Transparente

**Decision:** Excluir siniestros del KPI principal si faltan etapa 1 o etapa 16, pero mostrar indicador prominente de calidad de datos.

**Rationale:**

- KPIs con datos incompletos son engañosos y pueden llevar a malas decisiones
- Transparencia sobre exclusiones permite identificar problemas en procesos de captura
- El 71% de datos completos (ejemplo) sigue siendo estadísticamente significativo

**Alternatives considered:**

- _Incluir todos con estimaciones_: Rechazado porque estimaciones introducen sesgo desconocido
- _KPI dual (completo vs completo+parcial)_: Considerado para futura iteración

### 4. Percentil P90 sobre Promedio

**Decision:** Usar percentil 90 como métrica principal en visualizaciones, manteniendo promedio como dato secundario.

**Rationale:**

- El promedio es sensible a outliers (siniestros complejos de 2-5 años)
- P90 representa la experiencia de 9 de cada 10 siniestros
- Mejor para identificar cuellos de botella (si P90 es alto, hay problema sistémico)

**Trade-off:** P90 puede ocultar mejoras en el 10% más lento. Se mitiga manteniendo ambas métricas disponibles.

### 5. Feriados: Calendario Hardcoded Inicial, Configurable Futuro

**Decision:** Implementar calendario de feriados colombianos hardcoded para 2024-2025 inicialmente, con tabla configurable para actualizaciones sin deploy.

**Rationale:**

- Los feriados colombianos son predecibles y cambian poco
- Hardcoded permite cálculo rápido sin consulta a BD
- Tabla `feriados_colombia` permite agregar feriados puente sin código

**Implementation:**

```typescript
// Array hardcoded para años comunes
const FERIADOS_2024 = ['2024-01-01', '2024-01-08', ...];
// Tabla para feriados adicionales/puentes
CREATE TABLE feriados_colombia (fecha DATE PRIMARY KEY, nombre VARCHAR, es_puente BOOLEAN);
```

### 6. Clasificación de Tipo de Proceso: Automática por Duración y Etapas

**Decision:** Clasificar automáticamente en Normal/Prescripción Ordinaria/Prescripción Extraordinaria basado en:

1. ¿Pasa por etapa 13 (Prescripción)?
2. Duración total en días

**Rationale:**

- No requiere campo manual (propenso a errores)
- Basado en datos objetivos (etapas recorridas + tiempo)
- Permite reclasificación automática si cambian datos

**Reglas:**

```
IF etapa_13_fecha IS NULL AND duracion < 365 → 'normal'
IF duracion < 1095 → 'prescripcion_ordinaria'
ELSE → 'prescripcion_extraordinaria'
```

### 7. Tecnología: TypeScript + Supabase + React (existente)

**Decision:** Mantener stack tecnológico existente: TypeScript, React, Supabase (PostgreSQL), sin agregar nuevas dependencias.

**Rationale:**

- Consistencia con codebase existente
- No hay necesidad de herramientas analíticas especializadas para este MVP
- El equipo ya tiene expertise en estas tecnologías

**Alternatives considered:**

- _Apache Superset o Metabase_: Rechazado por complejidad innecesaria para este scope
- _Python/Pandas para procesamiento_: Considerado pero rechazado para mantener stack unificado

## Risks / Trade-offs

**[Riesgo] Datos históricos incompletos**
→ Si >50% de siniestros son excluidos, los KPIs no serán representativos
→ Mitigación: Mostrar alerta prominente, sugerir proyecto de limpieza de datos, permitir inclusión condicional con advertencias

**[Riesgo] Performance del procesamiento batch inicial**
→ Calcular métricas para miles de siniestros históricos puede tardar minutos
→ Mitigación: Procesar en lotes (batch de 100), mostrar progreso, ejecutar en horario de bajo tráfico, permitir pausa/reanudación

**[Riesgo] claim_history no tiene datos suficientes**
→ Si el sistema de auditoría es reciente, no habrá seguimientos históricos
→ Mitigación: Aceptar métricas de frecuencia incompletas para datos viejos, usar solo datos disponibles, documentar limitación

**[Riesgo] Cálculo de días hábiles sin feriados futuros**
→ Los feriados de años futuros no están en el calendario hardcoded
→ Mitigación: Implementar tabla de feriados configurable, alertar cuando se necesiten feriados no definidos, asumir solo fines de semana para fechas futuras lejanas

**[Riesgo] Complejidad de UI con muchos filtros**
→ Múltiples dimensiones de segmentación pueden confundir al usuario
→ Mitigación: Diseño de filtros progresivos (primero tipo de proceso, luego otras dimensiones), guardar vistas personalizadas, mostrar filtros activos claramente

**[Trade-off] Espacio de almacenamiento**
→ Tablas de métricas duplican información (etapas + cálculos)
→ Aceptado: El beneficio de query performance supera el costo de storage

**[Trade-off] Latencia de datos agregados**
→ Las métricas agregadas no son en tiempo real (se actualizan periódicamente)
→ Aceptado: Los datos de KPIs históricos no requieren actualización inmediata

## Migration Plan

### Fase 1: Preparación (1 día)

1. Crear tablas DDL: `sla_por_etapa`, `metricas_etapas`, `seguimientos_procesados`, `kpis_etapas_agregados`, `feriados_colombia`
2. Poblar `sla_por_etapa` con definiciones de SLAs para 16 etapas
3. Poblar `feriados_colombia` con feriados 2024-2025
4. Crear índices necesarios

### Fase 2: Procesamiento Histórico (1-2 días)

1. Ejecutar script batch para procesar siniestros históricos:
   - Leer de `siniestro_etapas` + `claim_history`
   - Calcular métricas por etapa
   - Guardar en `metricas_etapas`
2. Ejecutar en lotes de 100 siniestros para no saturar BD
3. Validar calidad: verificar % de exclusiones, muestra aleatoria de cálculos

### Fase 3: Despliegue Backend (1 día)

1. Deploy de `MetricasEtapasService.ts` y nuevos endpoints API
2. Habilitar endpoint `/api/kpis/eficiencia-etapas`
3. Configurar caché de consultas frecuentes

### Fase 4: Despliegue Frontend (1 día)

1. Deploy de nuevo dashboard "Eficiencia por Etapas"
2. Agregar enlace en navegación principal
3. Comunicar a usuarios la nueva funcionalidad

### Rollback Strategy

- Las nuevas tablas son aditivas (no modifican existentes)
- Si hay problemas, deshabilitar enlace a dashboard nuevo
- Los datos procesados se mantienen para análisis posterior
- Reprocesamiento posible si se detectan errores en cálculos

## Open Questions

1. **¿Cuál es el volumen real de datos?** Se estima "miles" de registros, pero necesitamos número exacto para dimensionar batch processing.

2. **¿Desde cuándo existe `claim_history` con datos confiables?** Si es reciente, las métricas de frecuencia solo serán válidas para siniestros nuevos.

3. **¿Los SLAs por etapa son universales o varían por aseguradora/ramo?** Actualmente asumimos SLAs universales, pero podrían necesitarse SLAs específicos.

4. **¿Qué hacer con siniestros en proceso (sin etapa 16)?** Se excluyen del KPI principal, pero ¿deben mostrarse en dashboard separado de "En Proceso"?

5. **¿Frecuencia de actualización de métricas agregadas?** Diaria, semanal, o bajo demanda? Afecta diseño de caché y procesos batch.

6. **¿Se necesita acceso diferenciado por rol?** Ejemplo: técnicos solo ven sus métricas, supervisores ven todo.
