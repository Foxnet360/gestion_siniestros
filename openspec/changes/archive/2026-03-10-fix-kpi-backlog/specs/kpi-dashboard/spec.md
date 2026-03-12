## MODIFIED Requirements

### Requirement: KPI 6 - Backlog de Siniestros Activos
El sistema SHALL mostrar el número total de siniestros activos y su porcentaje relativo respecto al total histórico o actual de siniestros registrados.
El porcentaje SHALL ser calculado dinámicamente dividiendo `backlogActivos` entre el número total real de siniestros (`totalClaims`), sin utilizar dividendos ni valores estáticos predefinidos.

#### Scenario: Visualización del KPI de Backlog
- **WHEN** el usuario visualiza la sección "SLA POR ETAPAS Y CONTROL DE BACKLOG" en el Dashboard principal
- **THEN** el sistema SHALL mostrar una gráfica tipo Donut (Donut Chart) titulada "CONTROL DE BACKLOG DE SINIESTROS ACTIVOS"
- **AND** el sistema SHALL mostrar el porcentaje preciso de siniestros activos, calculado dinámicamente con los datos de siniestros totales devolvidos por los servicios/APIs del sistema.
