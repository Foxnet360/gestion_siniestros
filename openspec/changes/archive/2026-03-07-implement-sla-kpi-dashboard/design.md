## Context

El sistema SGS (Sistema de Gestión de Siniestros) es una aplicación Vite + React 19 + TypeScript que gestiona el ciclo de vida de siniestros de seguros. Actualmente, el sistema:

- Almacena siniestros con observaciones en formato texto libre
- Carece de visibilidad sobre tiempos de resolución por etapas
- No tiene capacidad de reporting de KPIs operacionales
- Utiliza Supabase como backend (PostgreSQL)

Las observaciones contienen información temporal valiosa (fechas de etapas como "AJUSTADOR", "LIQUIDACIÓN", etc.) que actualmente no se extrae ni analiza sistemáticamente.

## Goals / Non-Goals

**Goals:**

- Implementar extracción automática de fechas de 16 etapas desde campo observaciones
- Crear servicio `SlaTrackingService` para procesar y almacenar datos temporales
- Desarrollar dashboard interactivo con 6+ KPIs operacionales
- Implementar endpoints REST para consulta de métricas con filtros dinámicos
- Agregar selector de amparos en formularios de siniestros
- Limpiar estados obsoletos del sistema

**Non-Goals:**

- Modificar el flujo de ingreso de observaciones (se mantiene texto libre)
- Implementar machine learning para extracción (usa búsqueda por texto exacto/regex)
- Crear sistema de alertas/notificaciones automáticas
- Exportación a Excel/PDF de reportes (fase futura)

## Decisions

### 1. Extracción de Fechas: Búsqueda por Texto Exacto vs Regex Compleja

**Decision:** Usar búsqueda por texto exacto (case-insensitive) con palabras clave predefinidas.

**Rationale:**

- Las observaciones siguen un patrón semi-estructurado: "ETAPA: FECHA" o "ETAPA - FECHA"
- Más predecible y debuggeable que regex complejas
- Menor overhead de procesamiento
- Fácil de extender con nuevas palabras clave

**Alternativa considerada:** Regex complejas para múltiples formatos → descartado por fragilidad ante variaciones en formato de entrada.

### 2. Almacenamiento: Tabla Normalizada vs JSONB

**Decision:** Tabla normalizada `siniestro_etapas` con columnas por etapa.

**Rationale:**

- Querying eficiente para agregaciones (SUM, AVG, COUNT)
- Facilita índices por fecha/etapa
- Mejor integridad referencial
- Compatible con ORM existente

**Estructura propuesta:**

```sql
siniestro_etapas (
  id SERIAL PRIMARY KEY,
  siniestro_id INTEGER REFERENCES siniestros(id),
  etapa_1_fecha DATE,  -- Aviso Siniestro
  etapa_2_fecha DATE,  -- Radicación
  -- ... hasta etapa 16
  updated_at TIMESTAMP
)
```

**Alternativa considerada:** JSONB con array de etapas → descartado por dificultad en agregaciones SQL.

### 3. Librería de Gráficos: Recharts vs Chart.js

**Decision:** Recharts (React-specific).

**Rationale:**

- Integración nativa con React 19
- Componentes declarativos
- TypeScript support built-in
- Tamaño de bundle moderado
- Comunidad activa en ecosistema React

**Alternativa considerada:** Chart.js → descartado por requerir wrapper adicional (react-chartjs-2).

### 4. Arquitectura de Endpoints: REST vs GraphQL

**Decision:** REST con query parameters para filtros.

**Rationale:**

- Consistente con API existente
- Simplifica caching
- Fácil de documentar/consumir
- Filtros son combinaciones predefinidas (no queries dinámicas complejas)

**Endpoints propuestos:**

- `GET /api/kpis/overview` - KPIs principales
- `GET /api/kpis/lead-time` - Ciclo de resolución
- `GET /api/kpis/tasas` - Tasas (desistimiento, objeción, prescripción)
- `GET /api/kpis/backlog` - Siniestros activos

### 5. Procesamiento de Observaciones: Batch vs Real-time

**Decision:** Procesamiento batch periódico + trigger en inserción/actualización.

**Rationale:**

- Datos históricos requieren migración batch
- Nuevas observaciones se procesan en tiempo real
- Balance entre consistencia y performance
- Facilita debugging de extracción

**Implementación:**

- Job batch para procesar backlog histórico
- Trigger PostgreSQL o hook Supabase para observaciones nuevas

### 6. Filtros de KPIs: Client-side vs Server-side

**Decision:** Server-side para agregaciones, client-side para presentación.

**Rationale:**

- Volumen de datos requiere agregación en base de datos
- Filtros multidimensionales (aseguradora, ramo, vendedor, fechas)
- Performance: no cargar todos los siniestros al cliente

## Risks / Trade-offs

**[Riesgo] Performance de queries en tabla de observaciones grandes**
→ Mitigación: Crear índices en campos de búsqueda, considerar particionamiento por fecha, evaluar materialized views para KPIs frecuentes

**[Riesgo] Formato inconsistente en observaciones históricas**
→ Mitigación: Implementar validación con fallback, logging de observaciones no parseables, proceso manual para casos edge

**[Riesgo] Cálculo incorrecto de fechas (zona horaria, festivos)**
→ Mitigación: Usar date-fns para manejo de fechas, definir claramente calendario hábil (Colombia), documentar lógica de cálculo

**[Riesgo] Acoplamiento entre extracción y presentación**
→ Mitigación: Separar `SlaTrackingService` (extracción) de `KpiService` (agregación), interfaces bien definidas

**[Trade-off] Complejidad vs Exactitud en extracción de fechas**

- A favor: Implementación simple con búsqueda por texto
- Contra: Puede omitir variaciones en formato
- Decisión: Aceptar 80-90% de cobertura inicial, iterar con feedback

**[Trade-off] Tiempo real vs Consistencia histórica**

- A favor: Procesamiento batch para migración controlada
- Contra: Delay en disponibilidad de datos históricos
- Decisión: Aceptar delay inicial, eventual consistencia

## Migration Plan

### Fase 1: Estructura de Datos

1. Crear tabla `siniestro_etapas`
2. Agregar índices necesarios
3. Script de migración batch para observaciones históricas

### Fase 2: Backend

1. Implementar `SlaTrackingService`
2. Crear endpoints `/api/kpis/*`
3. Agregar trigger para procesamiento en tiempo real

### Fase 3: Frontend

1. Instalar Recharts
2. Crear componente Dashboard
3. Implementar filtros UI
4. Agregar selector de amparos en formularios

### Fase 4: Limpieza

1. Identificar estados obsoletos
2. Remover de vistas y flujos
3. Validar no hay dependencias rompidas

### Rollback Strategy

- Mantener campo observaciones original (no se modifica)
- Soft delete en tabla `siniestro_etapas` (flag `is_active`)
- Feature flag para dashboard (mostrar/ocultar en UI)

## Open Questions

1. **Formato exacto de observaciones**: ¿Existe documentación de los formatos actuales usados por los usuarios? ¿Hay variaciones por tipo de siniestro?

2. **Calendario hábil**: ¿Qué festivos se consideran no hábiles? ¿Incluye sábados?

3. **Permisos**: ¿Qué roles pueden ver qué KPIs? ¿Hay datos sensibles en métricas?

4. **Frecuencia de actualización**: ¿Los KPIs deben actualizarse en tiempo real o es suficiente con refresco periódico (ej: cada hora)?

5. **Amparos**: ¿Cuál es la lista completa de amparos disponibles en "OTRO"? ¿Necesitan categorización?

6. **Estados obsoletos**: ¿Cuál es la lista exacta de estados a eliminar? ¿Están referenciados en reportes históricos?
