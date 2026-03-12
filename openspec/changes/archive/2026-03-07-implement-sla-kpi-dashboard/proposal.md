## Why

El sistema SGS actual carece de capacidad para rastrear tiempos de resolución por etapas (SLA) y no proporciona visibilidad operativa mediante KPIs. Esto dificulta la gestión proactiva de siniestros, el cumplimiento normativo (Art. 1075, 1080) y la toma de decisiones basada en datos. Se requiere implementar un módulo de seguimiento temporal y un dashboard de indicadores para mejorar la eficiencia operativa y la experiencia del cliente.

## What Changes

- **Nuevo módulo de seguimiento de tiempos (SLA)**: Implementar rastreo de 16 etapas clave del proceso de siniestros mediante extracción de fechas desde observaciones (regex/búsqueda exacta por texto: 'AJUSTADOR', 'LIQUIDACIÓN', 'OBJECIÓN', etc.)
- **Nuevo servicio `SlaTrackingService`**: Servicio backend para extraer y almacenar fechas de etapas desde el campo observaciones
- **Nuevo Dashboard de KPIs**: Tablero interactivo con visualizaciones (gráficos) mostrando indicadores clave con metas visuales
- **Nuevos endpoints `/api/kpis`**: Endpoints de agregación matemática para cada KPI con soporte de filtros (aseguradora, vendedor, ramo, fechas, etc.)
- **Nueva UI de amparos**: Lista desplegable en formularios de siniestros extrayendo datos de "Tipo de siniestro" → "OTRO"
- **Limpieza de estados obsoletos**: Eliminar de vistas y flujos los estados que ya no se utilizan en el sistema SS
- **Nuevas tablas en base de datos**: Estructura para almacenar fechas de etapas y métricas históricas

## Capabilities

### New Capabilities

- `sla-tracking`: Rastreo de tiempos por 16 etapas del proceso de siniestros, extracción de fechas desde observaciones
- `kpi-dashboard`: Dashboard interactivo con 6+ indicadores clave, visualizaciones gráficas y metas visuales
- `amparos-management`: Gestión de amparos afectados con lista desplegable en UI
- `kpi-api-endpoints`: Endpoints REST para consulta de KPIs con filtros multidimensionales

### Modified Capabilities

- _(Ninguno - no hay cambios en especificaciones existentes, solo nueva funcionalidad)_

## Impact

- **Backend**: Nuevo servicio `SlaTrackingService`, nuevos endpoints en controladores, nuevas entidades/tabla de base de datos para etapas
- **Frontend**: Nuevo componente Dashboard, nuevas páginas de KPIs, modificación de formularios de siniestros para amparos
- **Base de datos**: Nueva tabla `siniestro_etapas` para tracking temporal, posibles índices para búsqueda en observaciones
- **APIs**: Nuevos endpoints `/api/kpis/*` para consulta de indicadores
- **Dependencias**: Posible integración con librería de gráficos (Chart.js, Recharts o similar)
- **Performance**: Considerar impacto de queries de agregación en tabla de observaciones (evaluar índices)
