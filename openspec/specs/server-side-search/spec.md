## ADDED Requirements

### Requirement: Búsqueda server-side en múltiples campos

El sistema SHALL realizar búsquedas case-insensitive en la base de datos PostgreSQL usando el operador ILIKE en los campos: numero_siniestro, numero_siniestro_compania, asegurado, poliza, y aseguradora.

#### Scenario: Búsqueda por número de siniestro

- **WHEN** usuario ingresa "633" en el campo de búsqueda
- **THEN** el sistema SHALL ejecutar query SQL con `.ilike('numero_siniestro', '%633%')`
- **AND** retornar todos los claims que contengan "633" en cualquier posición del campo

#### Scenario: Búsqueda por número de siniestro compañía

- **WHEN** usuario ingresa "01-56498" en el campo de búsqueda
- **THEN** el sistema SHALL buscar en campo numero_siniestro_compania
- **AND** retornar claims que coincidan parcial o totalmente

#### Scenario: Búsqueda por nombre de asegurado

- **WHEN** usuario ingresa "Garcia" en el campo de búsqueda
- **THEN** el sistema SHALL buscar en campo asegurado usando ILIKE
- **AND** retornar claims donde el asegurado contenga "garcia" (case-insensitive)

### Requirement: Longitud mínima de búsqueda

El system SHALL requerir al menos 3 caracteres para realizar búsquedas server-side y SHALL mostrar un mensaje informativo cuando el término sea más corto.

#### Scenario: Búsqueda con término corto

- **WHEN** usuario ingresa "63" (2 caracteres) en el campo de búsqueda
- **THEN** el sistema SHALL NOT ejecutar búsqueda server-side
- **AND** SHALL mostrar mensaje "Ingrese al menos 3 caracteres para buscar"

### Requirement: Fallback a búsqueda client-side

El system SHALL realizar búsqueda server-side cuando hay un término de búsqueda activo, y SHALL realizar búsqueda client-side sobre datos ya cargados cuando no hay término de búsqueda.

#### Scenario: Sin término de búsqueda

- **WHEN** no hay texto en el campo de búsqueda
- **THEN** el sistema SHALL aplicar filtros de dropdown (Ramo, Aseguradora, Estado) sobre los claims cargados localmente
- **AND** SHALL NOT ejecutar queries adicionales a Supabase

#### Scenario: Con término de búsqueda

- **WHEN** usuario ingresa "test" (4+ caracteres) en el campo de búsqueda
- **THEN** el sistema SHALL ejecutar búsqueda server-side en Supabase
- **AND** SHALL ignorar filtros de dropdown durante la búsqueda server-side
- **AND** SHALL aplicar paginación sobre los resultados de búsqueda

### Requirement: Manejo de errores en búsqueda

El system SHALL manejar errores de red o base de datos durante búsquedas server-side y SHALL mostrar mensaje de error al usuario sin bloquear la UI.

#### Scenario: Error de conexión durante búsqueda

- **WHEN** ocurre un error de red durante búsqueda server-side
- **THEN** el sistema SHALL capturar el error
- **AND** SHALL mostrar mensaje "Error al buscar. Intente nuevamente."
- **AND** SHALL mantener el estado anterior de la lista de claims
