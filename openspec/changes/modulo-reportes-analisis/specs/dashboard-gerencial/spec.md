## ADDED Requirements

### Requirement: Dashboard muestra KPIs financieros consolidados
El dashboard gerencial DEBE mostrar los siguientes KPIs financieros calculados en tiempo real sobre el periodo seleccionado:
- Total reclamado (suma de monto_reclamo)
- Total indemnizado (suma de valor_indemnizacion para casos finalizados)
- % recuperación (Indemnizado / Reclamado)
- Valor promedio por siniestro (Reclamado / Total siniestros)
- Monto en riesgo por prescripción (suma de monto_reclamo de casos con riesgo alto)

#### Scenario: Usuario ADMIN visualiza KPIs financieros
- **WHEN** un usuario ADMIN accede al Dashboard Gerencial
- **AND** selecciona un rango de fechas
- **THEN** el sistema muestra los 5 KPIs financieros calculados sobre el periodo

### Requirement: Dashboard muestra KPIs operativos consolidados
El dashboard gerencial DEBE mostrar los siguientes KPIs operativos:
- Total siniestros activos (no finalizados)
- Total siniestros cerrados (finalizado = SI)
- % cerrados dentro del plazo objetivo (basado en meta definida)
- Tiempo promedio total Aviso→Pago (fecha_finalizacion - fecha_aviso)
- % siniestros con objeción (estado interno = OBJECIÓN)

#### Scenario: Usuario ADMIN visualiza KPIs operativos
- **WHEN** un usuario ADMIN accede al Dashboard Gerencial
- **THEN** el sistema muestra los 5 KPIs operativos calculados sobre el periodo

### Requirement: Filtros dinámicos combinables
El dashboard DEBE permitir aplicar filtros dinámicos que actualicen todos los KPIs en tiempo real:
- Rango de fechas (con opciones: Este mes, Mes pasado, Este trimestre, Trimestre pasado, Este año, Año pasado, Personalizado)
- Ramo (dropdown multi-select)
- Aseguradora (dropdown multi-select)
- Técnico responsable (dropdown multi-select)

#### Scenario: Usuario aplica filtros al dashboard
- **WHEN** un usuario selecciona filtros en el Dashboard Gerencial
- **THEN** todos los KPIs se recalculan automáticamente aplicando los filtros seleccionados
- **AND** el tiempo de respuesta es menor a 3 segundos

### Requirement: Visualización de tendencias temporales
El dashboard DEBE incluir gráficos de tendencia para los KPIs principales:
- Gráfico de barras: Reclamado vs Indemnizado por mes (últimos 12 meses)
- Gráfico de línea: Evolución de casos activos vs cerrados
- Indicadores de variación vs periodo anterior (flechas ↑↓ con porcentaje)

#### Scenario: Usuario visualiza tendencias
- **WHEN** un usuario ADMIN accede al Dashboard Gerencial
- **THEN** el sistema muestra gráficos de tendencia actualizados
- **AND** los gráficos usan Chart.js para visualización

### Requirement: Acceso restringido por rol
El Dashboard Gerencial DEBE ser accesible únicamente para usuarios con rol ADMIN.

#### Scenario: Usuario ADMIN accede al reporte
- **WHEN** un usuario ADMIN hace clic en "Reportes" en el sidebar
- **THEN** el sistema muestra el selector de reportes incluyendo Dashboard Gerencial

#### Scenario: Usuario TÉCNICO intenta acceder
- **WHEN** un usuario TÉCNICO navega a Reportes
- **THEN** el sistema muestra mensaje "Acceso restringido" o redirige al Dashboard principal
