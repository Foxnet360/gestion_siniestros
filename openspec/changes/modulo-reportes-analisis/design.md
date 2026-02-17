## Context

El sistema actual tiene un Dashboard básico con 3 KPIs simples y widgets de agrupación, pero carece de capacidades avanzadas de reportes estratégicos. La arquitectura existente incluye:
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Base de datos**: Supabase (PostgreSQL) con tablas `claims`, `state_history`, `timeline`, `amparos`
- **Modelo de datos**: Claim con 50+ campos, incluyendo `finalizado`, `fecha_finalizacion`, `fecha_aviso`
- **Autenticación**: Sistema de roles (ADMIN, TECNICO, ALIADO)
- **Estado**: ClaimsContext para manejo global de claims
- **Librerías existentes**: date-fns, xlsx, lucide-react

Se requiere construir un módulo de Reportes completo sin modificar la estructura de base de datos existente.

## Goals / Non-Goals

**Goals:**
- Dashboard Gerencial con 10 KPIs financieros/operativos y gráficos de tendencia
- Reporte Crítico de Prescripción con clasificación 🔴🟡🟢 y alertas
- Cálculo preciso de tiempos Aviso→Pago usando `fecha_finalizacion - fecha_aviso`
- Dashboard Operativo con productividad por técnico y cuellos de botella
- Análisis comparativo (mes vs mes, año vs año, benchmarking)
- Exportación profesional a Excel y PDF
- Tiempo de carga <3 segundos para todos los reportes
- Acceso restringido a rol ADMIN

**Non-Goals:**
- No modificar esquema de base de datos existente
- No implementar notificaciones push/email automáticas
- No crear caché de datos pre-calculados (todo en tiempo real)
- No implementar autenticación adicional
- No modificar el Dashboard principal existente (solo agregar módulo Reportes)

## Decisions

### 1. Arquitectura de Componentes
**Decision**: Crear estructura modular en `components/Reports/` con subcarpetas por reporte.

```
components/Reports/
├── ReportsPage.tsx              # Página principal/selector
├── common/
│   ├── ReportFilters.tsx        # Filtros reutilizables
│   ├── KpiCards.tsx             # Grid de KPIs
│   ├── ExportButtons.tsx        # Botones Excel/PDF
│   └── ReportLayout.tsx         # Layout común
├── DashboardGerencial/
│   ├── DashboardGerencial.tsx   # Contenedor
│   ├── KpiFinancieros.tsx       # KPIs financieros
│   ├── KpiOperativos.tsx        # KPIs operativos
│   └── TrendCharts.tsx          # Gráficos de tendencia
├── ReportePrescripcion/
│   ├── ReportePrescripcion.tsx
│   ├── TablaPrescripcion.tsx
│   └── RiesgoBadge.tsx
├── DashboardOperativo/
│   ├── DashboardOperativo.tsx
│   ├── ProductividadTecnicos.tsx
│   └── CasosEstancados.tsx
├── MetricasTiempo/
│   ├── MetricasTiempo.tsx
│   └── TiemposPorFase.tsx
└── AnalisisComparativo/
    ├── AnalisisComparativo.tsx
    └── ComparativosView.tsx
```

**Rationale**: Separación de responsabilidades, facilita testing y mantenimiento.

### 2. Librerías de Gráficos
**Decision**: Usar `chart.js` + `react-chartjs-2`

**Rationale**: 
- Muy flexible y customizable
- Buena documentación y comunidad
- Soporte para todos los tipos de gráficos necesarios (barras, líneas, pastel)
- Ligero en comparación con otras opciones

**Alternatives considered**: Recharts (más fácil pero menos flexible), D3 (demasiado complejo para este caso).

### 3. Exportación PDF
**Decision**: Usar `jspdf` + `html2canvas`

**Rationale**:
- Permite convertir componentes React existentes a PDF
- Mantiene consistencia visual entre UI y exportación
- Soporte para capturar gráficos Chart.js como imágenes

**Implementation approach**:
1. Crear versión "print-friendly" de cada reporte (componentes con sufijo `Printable`)
2. Usar `html2canvas` para capturar el DOM como imagen
3. Incrustar en PDF con `jspdf`
4. Agregar encabezados, pies de página y numeración manualmente

### 4. Cálculo de Métricas
**Decision**: Calcular todas las métricas en el cliente usando hooks personalizados

```typescript
// hooks/useReportMetrics.ts
export const useKpiFinancieros = (claims: Claim[], filters: ReportFilters) => { ... }
export const useKpiOperativos = (claims: Claim[], filters: ReportFilters) => { ... }
export const useTiemposPromedio = (claims: Claim[], stateHistory: StateHistory[]) => { ... }
export const useComparativos = (claims: Claim[], periodo: Periodo) => { ... }
```

**Rationale**:
- No requiere cambios en backend/DB
- Aprovecha datos ya cargados en ClaimsContext
- Filtros dinámicos sin latencia de red adicional
- Uso de `useMemo` para optimizar rendimiento

**Trade-off**: Para datasets muy grandes (>50k registros), podría tener problemas de performance. Mitigación: agregar paginación o virtualización si es necesario.

### 5. Estructura de Filtros
**Decision**: Filtros globales en `ReportsPage` que se pasan a todos los reportes vía props/context

```typescript
interface ReportFilters {
  dateRange: { start: Date; end: Date } | null;
  ramo: string[];
  aseguradora: string[];
  tecnico: string[];
}
```

**Rationale**: Consistencia de filtros entre reportes, evita re-implementar lógica en cada componente.

### 6. Control de Acceso
**Decision**: Reutilizar sistema de roles existente, agregar guard en ruta de Reportes

**Implementation**:
- Sidebar ya tiene `restricted: true` en item "Reportes"
- Agregar guard en `ReportsPage` que redirige si `role !== 'ADMIN'`

### 7. Tiempos por Fase
**Decision**: Usar tabla `state_history` para calcular tiempos por fase

**Logic**:
```typescript
// Agrupar estados por fase
const fases = {
  fase1: ['AVISO SINIESTRO', 'OBTENCIÓN SOPORTES', 'ESTUDIO TÉCNICO CORREDORES'],
  // ...
}

// Para cada claim, sumar days_duration de state_history
// Agrupar por fase y calcular promedio
```

**Rationale**: Datos históricos ya disponibles, cálculo preciso del tiempo real en cada fase.

## Risks / Trade-offs

### Risk: Performance con datasets grandes
**Impact**: Medio | **Likelihood**: Bajo (actualmente < 5k registros)
→ **Mitigation**: 
- Usar `useMemo` para todos los cálculos
- Implementar paginación en tablas grandes
- Considerar virtualización si tablas exceden 1000 filas
- Monitorear tiempos de carga, optimizar si supera 3 segundos

### Risk: Complejidad de exportación PDF
**Impact**: Medio | **Likelihood**: Alto
→ **Mitigation**:
- Crear componentes "printable" simplificados
- Usar CSS print media queries
- Capturar gráficos como imágenes estáticas para PDF
- MVP sin PDF complejo, iterar en fase 2 si es necesario

### Risk: Datos inconsistentes en `state_history`
**Impact**: Alto | **Likelihood**: Medio
→ **Mitigation**:
- Validar datos antes de cálculos (manejar nulls/undefined)
- Mostrar indicadores de "datos incompletos" cuando aplique
- No incluir claims sin state_history en métricas de tiempos

### Risk: Complejidad de filtros combinados
**Impact**: Bajo | **Likelihood**: Medio
→ **Mitigation**:
- Implementar filtros progresivamente (uno por uno)
- Testing exhaustivo de combinaciones
- Logs para debugging de filtros

### Trade-off: Tiempo real vs Pre-calculado
Elegimos cálculo en tiempo real para mantener simplicidad y evitar sincronización de datos.
**Cost**: Potencial lentitud con grandes volúmenes
**Benefit**: Datos siempre actualizados, sin infraestructura adicional

## Migration Plan

### Fase 1: Setup y Dashboard Gerencial
1. Instalar dependencias: `chart.js`, `react-chartjs-2`, `jspdf`, `html2canvas`
2. Crear estructura de carpetas `components/Reports/`
3. Implementar `ReportsPage` con selector de reportes
4. Implementar `ReportFilters` componente
5. Implementar `DashboardGerencial` con KPIs y gráficos

### Fase 2: Reporte Crítico de Prescripción
1. Implementar lógica de clasificación de riesgo
2. Crear `ReportePrescripcion` con tabla y filtros
3. Implementar acciones (ver detalle, asignar prioridad)
4. Testing de clasificación 🔴🟡🟢

### Fase 3: Métricas de Tiempo y Dashboard Operativo
1. Implementar hooks `useTiemposPromedio` usando `state_history`
2. Crear visualización de tiempos por fase
3. Implementar `DashboardOperativo` con productividad
4. Implementar detección de casos estancados

### Fase 4: Análisis Comparativo
1. Implementar lógica de comparativos mes vs mes, año vs año
2. Crear componentes de ranking y benchmarking
3. Testing de tendencias y proyecciones

### Fase 5: Exportación
1. Implementar servicio `excelExport.ts` usando `xlsx`
2. Implementar servicio `pdfExport.ts` usando `jspdf`+`html2canvas`
3. Agregar botones de exportación a todos los reportes
4. Testing de formatos y calidad

### Rollback Strategy
- Cada fase es independiente, se puede desactivar fácilmente
- Feature flag en `constants.ts`: `REPORTS_MODULE_ENABLED`
- Revertir commit específico de fase si hay problemas

## Open Questions

1. **Meta de tiempo objetivo**: ¿Cuál es el valor exacto para "plazo objetivo de cierre" (default: 45 días)?
2. **Días caso estancado**: ¿Cuántos días sin movimiento definen un caso estancado (default: 30)?
3. **Logo para PDFs**: ¿Hay un logo oficial de la empresa para incluir en portadas de PDF?
4. **Colores de gráficos**: ¿Hay paleta de colores corporativa específica para usar?
5. **Frecuencia de datos históricos**: ¿Se necesitan datos históricos más allá de 2 años?

## Technical Stack Summary

| Componente | Tecnología |
|------------|------------|
| Gráficos | Chart.js + react-chartjs-2 |
| Exportación Excel | xlsx (ya instalada) |
| Exportación PDF | jspdf + html2canvas |
| Cálculos | Client-side con hooks useMemo |
| Filtros | React state + URL params opcional |
| Acceso | Role-based (ADMIN only) |
| Fechas | date-fns (ya instalada) |
