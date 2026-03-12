## Context

El sistema actual de gestión de siniestros utiliza un dashboard básico que muestra 6 KPIs principales en formato de tarjetas simples. Aunque funcional, no proporciona la visualización avanzada ni la organización temática que requieren los gestores de seguros para monitorear eficientemente el negocio.

La imagen de referencia muestra un dashboard sofisticado dividido en secciones claras:

- **Indicadores de Eficiencia Operativa**: Métricas críticas de velocidad y calidad
- **Gestión Técnica y Financiera**: Análisis de frecuencia y severidad por ramo
- **SLA por Etapas y Control de Backlog**: Pipeline visual y cumplimiento de tiempos
- **Plan de Acción**: Tareas pendientes y seguimiento

El proyecto utiliza React 19 + TypeScript + Vite con Tailwind CSS para estilos, Recharts para visualizaciones básicas, y Supabase como backend.

## Goals / Non-Goals

**Goals:**

- Rediseñar el dashboard existente para usar un layout dividido en 4 secciones temáticas
- Implementar visualizaciones avanzadas: gauges, donuts, líneas de tiempo, barras horizontales
- Crear un sistema de filtros dinámicos en el header (aseguradora, ramo, vendedor, fecha)
- Desarrollar componentes reutilizables para cada tipo de visualización
- Integrar con datos existentes de Supabase mediante nuevas queries agregadas
- Mantener responsividad para diferentes tamaños de pantalla
- Usar formato de moneda colombiana ($ 15.000.000) en todos los valores monetarios

**Non-Goals:**

- No se modificará el esquema de base de datos existente (solo se crearán vistas/functions si es necesario)
- No se implementará autenticación o autorización adicional
- No se creará funcionalidad de exportación a PDF/Excel en este cambio
- No se implementará backend de cálculos en tiempo real (usar polling o caché)

## Decisions

### 1. Estructura de Componentes

**Decision**: Dividir el dashboard en 5 componentes principales:

- `OperationalEfficiencySection`: Lead time, tasas (gauge, donut, trend lines)
- `FinancialMetricsSection`: Frecuencia (línea) y severidad (barras)
- `SLATrackingSection`: Backlog donut, timeline, tiempo por etapa
- `ActionPlanPanel`: Lista de tareas con estados
- `DashboardFilters`: Barra de filtros superior

**Rationale**: Separación de responsabilidades facilita mantenimiento y testing. Cada sección puede desarrollarse y probarse independientemente.

**Alternatives considered**: Un solo componente monolítico - rechazado por complejidad y dificultad de mantenimiento.

### 2. Librería de Charts

**Decision**: Usar **Recharts** (ya está en el proyecto) + componentes custom para gauges.

**Rationale**:

- Recharts ya está integrado y funcionando
- Es flexible para crear líneas, barras, donuts
- Para gauges, crear componente custom usando SVG o librería ligera como `react-gauge-chart`

**Alternatives considered**:

- Chart.js: Requeriría agregar dependencia adicional
- D3.js: Demasiado complejo para este caso de uso

### 3. Formato de Moneda

**Decision**: Usar formato colombiano `$ 15.000.000,00` (punto como separador de miles, coma para decimales).

**Rationale**: El negocio opera en Colombia y debe usar formato local.

**Implementation**: Helper function `formatCOP(value: number): string` usando Intl.NumberFormat con locale 'es-CO'.

### 4. Estrategia de Datos

**Decision**: Usar React Query (o implementación existente) con estrategia de caché y refetch.

**Rationale**: Los KPIs no necesitan actualización en tiempo real absoluto. Un refetch cada 30 segundos o manual es suficiente.

**Data fetching pattern**:

```typescript
const { data: leadTimeData, isLoading } = useQuery({
  queryKey: ['leadTime', filters],
  queryFn: () => fetchLeadTime(filters),
  refetchInterval: 30000,
});
```

### 5. Layout Responsivo

**Decision**: Grid layout de CSS con breakpoints:

- Desktop (>1280px): 4 columnas para KPIs operativos, 2 columnas para secciones
- Tablet (768-1280px): 2 columnas
- Mobile (<768px): 1 columna, scroll vertical

**Rationale**: Tailwind CSS grid facilita implementación responsive sin media queries complejos.

### 6. Estado de Filtros

**Decision**: Centralizar estado de filtros en contexto `DashboardFiltersContext`.

**Rationale**: Múltiples secciones necesitan acceder a los mismos filtros. Context evita prop drilling.

**Implementation**:

```typescript
interface FilterState {
  aseguradora: string | null;
  ramo: string[];
  vendedor: string | null;
  dateRange: { start: Date; end: Date };
}
```

### 7. Timeline SLA

**Decision**: Implementar como componente SVG custom con nodos clickeables.

**Rationale**:

- Recharts no tiene componente de timeline horizontal con nodos
- SVG permite control total sobre posicionamiento y estilos
- Nodos deben ser interactivos (hover para detalles)

**Structure**:

- Línea base horizontal
- Círculos (nodos) posicionados proporcionalmente
- Etiquetas debajo
- Iconos de estado (check, warning, clock)

## Risks / Trade-offs

### [Riesgo] Performance con grandes volúmenes de datos

**Impacto**: Queries agregadas sobre miles de siniestros pueden ser lentas
**Mitigación**:

- Usar índices en Supabase sobre campos de fecha y estado
- Implementar paginación o límite de período (últimos 12 meses por defecto)
- Considerar materialized views para cálculos complejos

### [Riesgo] Complejidad del timeline SVG

**Impacto**: Componente custom puede tener bugs de posicionamiento
**Mitigación**:

- Usar librería probada como `react-timeline-range-slider` como base
- Extensivo testing en diferentes tamaños de pantalla
- Fallback a lista simple si SVG falla

### [Riesgo] Formato de moneda inconsistente

**Impacto**: Algunos valores pueden mostrarse con formato incorrecto
**Mitigación**:

- Crear componente `CurrencyDisplay` reusable
- Usar siempre helper `formatCOP()`
- Auditar todos los lugares donde se muestran valores monetarios

### [Riesgo] Acoplamiento de filtros

**Impacto**: Cambios en estructura de filtros afectan múltiples componentes
**Mitigación**:

- Definir interfaz `FilterState` claramente desde el inicio
- Usar TypeScript strict mode
- Crear tests de integración para flujo de filtros

### [Trade-off] Real-time vs Performance

**Decision**: Usar polling cada 30s en lugar de WebSockets reales
**Justificación**:

- WebSockets añaden complejidad de infraestructura
- KPIs no requieren actualización instantánea
- 30s es suficiente para dashboard operativo

## Migration Plan

1. **Fase 1**: Crear estructura base
   - Nuevos directorios: `components/dashboard/sections/`
   - Context `DashboardFiltersContext`
   - Helper `formatCOP`

2. **Fase 2**: Implementar componentes de visualización
   - GaugeChart, DonutChart (wrappers de Recharts o custom)
   - TimelineSLA (SVG)
   - ActionPlanPanel

3. **Fase 3**: Secciones del dashboard
   - OperationalEfficiencySection
   - FinancialMetricsSection
   - SLATrackingSection

4. **Fase 4**: Integración
   - DashboardFilters en header
   - Conectar con queries reales de Supabase
   - Testing end-to-end

5. **Fase 5**: Rollout
   - Feature flag para mostrar nuevo dashboard
   - Validación con usuarios piloto
   - Remover flag y deprecar dashboard anterior

**Rollback**: Simplemente ocultar nueva UI y volver a mostrar dashboard anterior mediante feature flag.

## Open Questions

1. ¿Hay datos históricos suficientes para mostrar tendencias de 12 meses o se necesita sembrar datos de prueba?
2. ¿Cuál es la definición exacta de cada etapa del workflow (1-16) para el timeline?
3. ¿Las tareas del Plan de Acción vienen de una tabla existente o se almacenan en localStorage?
4. ¿Se requiere comparación año vs año o solo tendencia mensual?
5. ¿Hay límite de ramos a mostrar en el filtro o se muestran todos los disponibles?
