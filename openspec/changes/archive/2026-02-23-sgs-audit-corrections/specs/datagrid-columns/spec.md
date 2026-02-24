## ADDED Requirements

### Requirement: Master list column configuration

The Master List DataGrid SHALL display exactly 12 columns in the following order: Número de Siniestro, Número de Siniestro Compañía, Tipo de Siniestro, Fecha del Siniestro, Fecha de Aviso, Fecha Radicación Compañía, Proveedor Asignado, Número de Póliza, Aseguradora, Ramo, Estado de la Etapa, Último Seguimiento, Estado Última Gestión, Próximo Seguimiento.

#### Scenario: Viewing master list

- **WHEN** a user navigates to the Master List view
- **THEN** the DataGrid SHALL display all 12 specified columns
- **AND** columns SHALL be in the specified order
- **AND** all columns SHALL be sortable

### Requirement: Column visibility and resizing

Users SHALL be able to resize columns and toggle column visibility while maintaining the specified default configuration.

#### Scenario: Column customization

- **WHEN** a user resizes or hides columns
- **THEN** the system SHALL persist these preferences
- **AND** restore them on next visit
