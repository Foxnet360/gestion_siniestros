## Why

El dashboard actual de KPIs no refleja adecuadamente las métricas críticas del negocio de siniestros de seguros. Se requiere un rediseño completo que presente indicadores operativos, financieros y de SLA en una interfaz unificada y visualmente atractiva, permitiendo a los gestores tomar decisiones informadas basadas en datos históricos y tendencias.

## What Changes

- **Rediseño completo del dashboard de KPIs** con nueva estructura visual dividida en secciones temáticas
- **Sección "Indicadores de Eficiencia Operativa"**: Ciclo de resolución (lead time), tasa de desistimiento, tasa de objetados, tasa de prescritos
- **Sección "Gestión Técnica y Financiera"**: Frecuencia de siniestralidad desglosada por ramo, severidad por ramo con valores monetarios
- **Sección "SLA por Etapas y Control de Backlog"**: Visualización del pipeline de siniestros, control de backlog activo/finalizado, línea de tiempo SLA por etapas
- **Sección "Plan de Acción"**: Tareas pendientes con estados de progreso y acciones
- **Nuevos componentes de visualización**: Gráficos de gauge, donuts, líneas de tiempo, barras horizontales comparativas
- **Filtros dinámicos**: Por aseguradora, ramo, vendedor y rango de fechas
- **Integración con datos históricos**: Cálculos de tendencias y comparativas temporales

## Capabilities

### New Capabilities

- `kpi-operational-efficiency`: Visualización de métricas operativas (ciclo resolución, tasas desistimiento/objetados/prescritos)
- `kpi-financial-metrics`: Indicadores financieros y técnicos (frecuencia y severidad por ramo)
- `kpi-sla-tracking`: Seguimiento de SLA por etapas del workflow y control de backlog
- `kpi-action-plan`: Gestión visual de tareas pendientes y plan de acción
- `dashboard-filters`: Sistema de filtros dinámicos para segmentación de datos

### Modified Capabilities

- `kpi-dashboard`: Actualización de los requisitos de visualización y estructura del dashboard existente

## Impact

- **Frontend**: Modificación completa del componente Dashboard.tsx y creación de nuevos subcomponentes especializados
- **Nuevas dependencias**: Potencial necesidad de librerías de charts avanzados (Recharts, Chart.js o similar)
- **Servicios de datos**: Nuevos endpoints o queries para obtener métricas desglosadas por ramo, vendedor y períodos históricos
- **Base de datos**: Posibles nuevas vistas o funciones SQL para cálculos agregados de KPIs
- **UI/UX**: Cambio significativo en la experiencia de usuario del dashboard principal
- **Performance**: Consideraciones de carga para consultas de datos históricos complejas
