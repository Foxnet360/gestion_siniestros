## 1. Setup y Estructura Base

- [x] 1.1 Crear directorio `src/components/dashboard/sections/`
- [x] 1.2 Crear directorio `src/components/dashboard/charts/`
- [x] 1.3 Crear directorio `src/context/DashboardFilters/`
- [x] 1.4 Crear archivo `src/utils/formatCurrency.ts` con helper formatCOP
- [x] 1.5 Instalar librería gauge si es necesaria (react-gauge-chart o similar)

## 2. Utilidades y Helpers

- [x] 2.1 Implementar `formatCOP(value: number): string` usando Intl.NumberFormat con locale 'es-CO'
- [x] 2.2 Crear test unitario para formatCOP
- [x] 2.3 Crear componente reutilizable `CurrencyDisplay` que use formatCOP
- [x] 2.4 Crear tipos TypeScript para FilterState y DashboardData

## 3. Contexto de Filtros

- [x] 3.1 Crear `DashboardFiltersContext.tsx` con estado centralizado de filtros
- [x] 3.2 Definir interfaz FilterState con: aseguradora, ramo[], vendedor, dateRange
- [x] 3.3 Crear provider con valores por defecto
- [x] 3.4 Crear hook `useDashboardFilters()` para consumir el contexto

## 4. Componentes de Visualización Base

- [x] 4.1 Crear `GaugeChart` component para Lead Time y tasas
- [x] 4.2 Crear `DonutChart` component para Backlog y tasas
- [x] 4.3 Crear `TimelineChart` component para tendencias temporales
- [x] 4.4 Crear `HorizontalBarChart` component para tiempo por etapa
- [x] 4.5 Crear `VerticalBarChart` component para severidad por ramo

## 5. Componentes de Sección

### 5.1 Indicadores de Eficiencia Operativa

- [x] 5.1.1 Crear `OperationalEfficiencySection` component
- [x] 5.1.2 Implementar Lead Time gauge con meta <30 días
- [x] 5.1.3 Implementar Tasa de Desistimiento (8%) con donut
- [x] 5.1.4 Implementar Tasa de Objetados (6%) con indicador circular
- [x] 5.1.5 Implementar Tasa de Prescritos con bar chart
- [x] 5.1.6 Agregar mini líneas de tendencia a cada KPI
- [x] 5.1.7 Implementar color-coding según metas (verde/amarillo/rojo)

### 5.2 Gestión Técnica y Financiera

- [x] 5.2.1 Crear `FinancialMetricsSection` component
- [x] 5.2.2 Implementar Frecuencia de Siniestralidad con línea de tendencia 12 meses
- [x] 5.2.3 Mostrar valor actual destacado (ej: 15%)
- [x] 5.2.4 Implementar Severidad por Ramo con barras verticales
- [x] 5.2.5 Formatear valores en pesos colombianos ($ 15.000.000)
- [x] 5.2.6 Agregar mensaje "GENERAR DATOS HISTÓRICOS ÚLTIMOS 3 MESES" si aplica
- [x] 5.2.7 Agregar nota sobre lista desplegable por amparo

### 5.3 SLA por Etapas y Control de Backlog

- [x] 5.3.1 Crear `SLATrackingSection` component
- [x] 5.3.2 Implementar Backlog donut (18% abiertos / 82% finalizados)
- [x] 5.3.3 Mostrar META: <19% y breakdown detallado
- [x] 5.3.4 Crear `TimelineSLA` component con SVG (16 etapas)
- [x] 5.3.5 Dibujar línea base horizontal con nodos
- [x] 5.3.6 Implementar color-coding de nodos (azul/verde/naranja/rojo)
- [x] 5.3.7 Agregar etiquetas de etapas debajo de cada nodo
- [x] 5.3.8 Agregar iconos de estado (check/warning/clock)
- [x] 5.3.9 Crear gráfico de barras horizontales para tiempo promedio por etapa
- [x] 5.3.10 Mostrar líneas de referencia SLA
- [x] 5.3.11 Agregar mensaje "Pendiente para medir con datos históricos"

### 5.4 Plan de Acción

- [x] 5.4.1 Crear `ActionPlanPanel` component
- [x] 5.4.2 Implementar lista de tareas con checkboxes
- [x] 5.4.3 Mostrar badges de estado: EN PROCESO, PENDIENTE, VALIDANDO CON ASEGURADORAS
- [x] 5.4.4 Implementar color-coding de badges (azul/naranja/amarillo)
- [x] 5.4.5 Agregar botones de acción: "Marcar como Completada", "PENDIENTE"
- [x] 5.4.6 Mostrar tareas de ejemplo:
- [x] 5.4.7 Implementar toggle de estado al hacer clic en badge

## 6. Sistema de Filtros

- [x] 6.1 Crear `DashboardFilters` component para header
- [x] 6.2 Implementar dropdown "ASEGURADORA" con lista de compañías
- [x] 6.3 Implementar dropdown "RAMO" con multi-selección
- [x] 6.4 Implementar dropdown "VENDEDOR" con nombres de agentes
- [x] 6.5 Implementar selector de fechas "FECHA" con date picker
- [x] 6.6 Agregar presets rápidos: Último mes, Últimos 3 meses, Último año
- [x] 6.7 Implementar botón "GENERAR REPORTE" con estilo primario
- [x] 6.8 Mostrar indicadores de filtros activos
- [x] 6.9 Agregar opción "Limpiar filtros"
- [x] 6.10 Implementar persistencia de filtros en URL/localStorage

## 7. Queries y Servicios de Datos

- [x] 7.1 Crear `src/services/kpiService.ts`
- [x] 7.2 Implementar `fetchLeadTime(filters)` query
- [x] 7.3 Implementar `fetchTasas(filters)` query (desistimiento, objetados, prescritos)
- [x] 7.4 Implementar `fetchFrecuenciaSiniestralidad(filters)` query
- [x] 7.5 Implementar `fetchSeveridadPorRamo(filters)` query
- [x] 7.6 Implementar `fetchBacklogControl(filters)` query
- [x] 7.7 Implementar `fetchTiempoPorEtapa(filters)` query
- [x] 7.8 Implementar `fetchTimelineSLA(filters)` query
- [x] 7.9 Crear views SQL en Supabase si es necesario para agregaciones
- [x] 7.10 Agregar índices en campos de fecha y estado para performance
- [x] 7.11 Implementar fallback a tabla claims cuando siniestro_etapas está vacía

## 8. Integración y Queries React

- [x] 8.1 Crear hooks custom: `useLeadTime()`, `useTasas()`, `useFrecuencia()`, etc.
- [x] 8.2 Implementar React Query con refetchInterval de 30 segundos
- [x] 8.3 Conectar filtros con queries mediante queryKey dinámico
- [x] 8.4 Implementar estados de loading con skeletons
- [x] 8.5 Implementar manejo de errores y mensajes de error amigables
- [x] 8.6 Agregar opción de refetch manual

## 9. Layout y Responsive

- [x] 9.1 Crear grid layout principal del dashboard
- [x] 9.2 Implementar layout 4 columnas para KPIs operativos (desktop >1280px)
- [x] 9.3 Implementar layout 2 columnas para secciones (desktop)
- [x] 9.4 Implementar layout 2 columnas para tablet (768-1280px)
- [x] 9.5 Implementar layout 1 columna para mobile (<768px)
- [x] 9.6 Agregar scroll vertical suave en mobile
- [x] 9.7 Implementar sidebar de navegación con: Resumen, Eficiencia Operativa, Gestión Financiera, SLA por Etapas, Alertas, Configuración

## 10. Dashboard Principal

- [x] 10.1 Actualizar `Dashboard.tsx` con nueva estructura
- [x] 10.2 Integrar `DashboardFilters` en header
- [x] 10.3 Integrar `OperationalEfficiencySection`
- [x] 10.4 Integrar `FinancialMetricsSection`
- [x] 10.5 Integrar `SLATrackingSection`
- [x] 10.6 Integrar `ActionPlanPanel`
- [x] 10.7 Agregar Provider de DashboardFilters en nivel superior
- [x] 10.8 Implementar feature flag para mostrar/ocultar nuevo dashboard

## 11. Testing

- [x] 11.1 Crear tests unitarios para formatCOP
- [x] 11.2 Crear tests para DashboardFiltersContext
- [x] 11.3 Crear tests para componentes de charts (Gauge, Donut)
- [x] 11.4 Crear tests de integración para flujo de filtros
- [x] 11.5 Verificar formato de moneda en todos los valores monetarios
- [x] 11.6 Testear responsive en diferentes viewports
- [x] 11.7 Verificar color-coding según metas

## 12. Performance y Optimización

- [x] 12.1 Implementar React.memo en componentes de charts
- [x] 12.2 Verificar queries no hagan fetching innecesario
- [x] 12.3 Implementar virtualización si la lista de tareas es muy larga (Not needed - ActionPlanPanel has <10 tasks)
- [x] 12.4 Optimizar re-renders con useMemo y useCallback
- [x] 12.5 Verificar tamaño de bundle no aumente significativamente

## 13. Documentación y Rollout

- [x] 13.1 Actualizar README con nueva estructura de dashboard
- [x] 13.2 Documentar cómo agregar nuevos KPIs
- [x] 13.3 Crear guía de usuario para filtros
- [x] 13.4 Preparar demo con datos de prueba
- [x] 13.5 Configurar feature flag en producción
- [x] 13.6 Plan de rollout gradual (usuarios piloto)
- [x] 13.7 Preparar rollback plan (ocultar feature flag)
