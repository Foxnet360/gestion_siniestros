## Why

El KPI "Backlog de Siniestros Activos" actualmente exhibe un valor porcentual manual y posiblemente incorrecto en la tarjeta *Donut Chart* de la vista "Cuadro de Mando de Siniestros de Seguros" (`SlaDashboard`). Esto ocurre porque el componente `SLATrackingSection` recae en el ID del "Magic Number" `1461` como el total absoluto de casos de todas las operaciones para deducir el porcentaje total relativo, en lugar de recibir dinámicamente este total mediante las métricas provenientes de la API o base de datos. Como consecuencia, si el volumen de datos filtrados o reales cambia, el porcentaje mostrado en la interfaz del usuario será inexacto.

## What Changes

- Modificación principal en el Frontend para pasar dinámicamente el valor total de siniestros al componente `SLATrackingSection`.
- Eliminación del "Magic Number" (`1461`) en `SlaDashboard.tsx` (L122-123).
- Se usará en su reemplazo una variable calculada proveniente de los contadores reales devueltos por el endpoint del KPI (`tasas.counts.total` de los KPI genéricos).
- Por tanto, la tarjeta gráfica en el Frontend operará con datos reales e interactuará sin problemas al aplicar los distintos filtros de vista.

## Capabilities

### New Capabilities
<!-- Capabilities being introduced. Replace <name> with kebab-case identifier (e.g., user-auth, data-export, api-rate-limiting). Each creates specs/<name>/spec.md -->

### Modified Capabilities
<!-- Existing capabilities whose REQUIREMENTS are changing (not just implementation).
     Only list here if spec-level behavior changes. Each needs a delta spec file.
     Use existing spec names from openspec/specs/. Leave empty if no requirement changes. -->
- `kpi-dashboard`: Corrección de cálculos en la tarjeta gráfica del "Backlog de Siniestros Activos" mediante remoción del total de siniestros quemado en código duro.

## Impact

<!-- Affected code, APIs, dependencies, systems -->
- **UI/Frontend:** Componente `src/components/Dashboard/SlaDashboard.tsx` (modificación principal).
- No se detectan impactos negativos de contrato ni breaking en el Backend ni la DB.
