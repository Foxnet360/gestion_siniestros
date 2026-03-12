# Purpose

Display SLA tracking KPIs including backlog control, workflow timeline visualization, and pipeline flow indicators.

## Requirements

### Requirement: Backlog Control Visualization

The system SHALL display backlog control showing active vs finalized claims in a donut chart format.

#### Scenario: Display backlog donut chart

- **WHEN** the user accesses the SLA section
- **THEN** the system SHALL display a donut chart showing the distribution between active and finalized claims
- **AND** SHALL display percentages (e.g., Siniestros Abiertos: 18%, Siniestros Finalizados: 82%)
- **AND** SHALL show the target indicator (META: <19%)

#### Scenario: Backlog breakdown detail

- **WHEN** the user hovers over the backlog chart
- **THEN** the system SHALL display a detailed breakdown: Abiertos, Siniestros, Finalizados with their respective percentages

### Requirement: SLA Timeline by Stage

The system SHALL display a visual timeline showing SLA compliance across all workflow stages.

#### Scenario: Display SLA timeline

- **WHEN** the user views the SLA section
- **THEN** the system SHALL display a horizontal timeline with numbered stages (1-16)
- **AND** SHALL use color coding: blue for normal, green for completed within SLA, orange for warning, red for exceeded
- **AND** SHALL display stage names below each node (e.g., "Aviso Siniestro", "Radicación Compañía", etc.)

#### Scenario: Stage hover details

- **WHEN** the user hovers over a stage node
- **THEN** the system SHALL display the stage name and SLA status
- **AND** SHALL show the average time spent in that stage

#### Scenario: Critical stage alerts

- **WHEN** a claim exceeds SLA in any stage
- **THEN** the system SHALL highlight the corresponding node in red or orange
- **AND** SHALL display a warning icon

### Requirement: Average Time by Stage

The system SHALL display average time spent in each workflow stage as a horizontal bar chart.

#### Scenario: Display time by stage chart

- **WHEN** the user views the SLA metrics
- **THEN** the system SHALL display a horizontal bar chart with stages on Y-axis and days on X-axis
- **AND** SHALL show SLA limits as vertical reference lines
- **AND** SHALL color bars based on compliance (green = within SLA, red = exceeded)

#### Scenario: Stage list display

- **WHEN** the chart renders
- **THEN** the system SHALL list all stages: Documentación Recibida, Radicación Compañía, Liquidación, Revisión Liquidación, Solicitud Documentos Adicionales, Objeción, etc.
- **AND** SHALL display corresponding average days for each

#### Scenario: Pending data message

- **WHEN** historical data is insufficient
- **THEN** the system SHALL display "Pendiente para medir con datos históricos" below the chart

### Requirement: Pipeline Visualization

The system SHALL display a visual pipeline showing claims distribution across workflow stages.

#### Scenario: Pipeline flow display

- **WHEN** the user accesses the SLA section
- **THEN** the system SHALL display icons representing each major workflow phase
- **AND** SHALL connect them with flow lines showing progression
- **AND** SHALL display status indicators (checkmarks, warnings) on completed/pending stages

### Requirement: Action Plan Panel

The system SHALL display a task list panel showing pending actions and action plans.

#### Scenario: Display task list

- **WHEN** the user views the SLA section
- **THEN** the system SHALL display a list of pending tasks with checkboxes
- **AND** SHALL show task status: "EN PROCESO", "PENDIENTE", "VALIDANDO CON ASEGURADORAS"
- **AND** SHALL allow marking tasks as completed

#### Scenario: Task examples display

- **WHEN** the task panel loads
- **THEN** the system SHALL display example tasks like:
  - "Eliminar estados que no utilizamos de SS"
  - "Crear lista desplegable de los amparos afectados"
  - "Validar con aseguradoras sobre aviso con solo nombre y NIT"

#### Scenario: Task action buttons

- **WHEN** viewing a task
- **THEN** the system SHALL provide action buttons: "Marcar como Completada", "PENDIENTE"
- **AND** SHALL update task status on click
