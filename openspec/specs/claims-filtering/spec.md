## ADDED Requirements

### Requirement: Modo de búsqueda híbrida

El system SHALL soportar dos modos de búsqueda/filtrado: (1) Búsqueda server-side cuando hay término de búsqueda de texto, y (2) Filtrado client-side cuando solo hay filtros de dropdown aplicados.

#### Scenario: Solo filtros de dropdown activos

- **WHEN** usuario selecciona filtro "Ramo: AUTOS" y no hay término de búsqueda
- **THEN** el sistema SHALL aplicar filtro client-side sobre los claims cargados
- **AND** SHALL NOT ejecutar queries adicionales a Supabase
- **AND** SHALL mostrar resultados paginados

#### Scenario: Búsqueda de texto activa

- **WHEN** usuario ingresa "633" en campo de búsqueda
- **THEN** el sistema SHALL ejecutar búsqueda server-side
- **AND** SHALL ignorar temporalmente filtros de dropdown
- **AND** SHALL mostrar resultados paginados de la búsqueda

#### Scenario: Combinación de búsqueda y filtros

- **WHEN** usuario tiene término de búsqueda "633" y filtro "Ramo: AUTOS"
- **THEN** el sistema SHALL ejecutar búsqueda server-side por "633"
- **AND** SHALL aplicar filtro "Ramo: AUTOS" client-side sobre los resultados de búsqueda
- **AND** SHALL mostrar solo claims que cumplan ambas condiciones

### Requirement: Prioridad de búsqueda sobre filtros

El system SHALL dar prioridad a la búsqueda server-side cuando hay un término de búsqueda activo, aplicando filtros de dropdown sobre los resultados de búsqueda.

#### Scenario: Filtros aplicados antes de búsqueda

- **WHEN** usuario tiene filtro "Estado: PENDIENTE" aplicado (mostrando 200 claims)
- **AND** usuario ingresa término de búsqueda "500"
- **THEN** el sistema SHALL ejecutar búsqueda server-side por "500" (en toda la BD)
- **AND** SHALL aplicar filtro "Estado: PENDIENTE" sobre resultados de búsqueda
- **AND** SHALL resetear a página 1

### Requirement: Indicador visual de modo de búsqueda

El system SHALL mostrar un indicador visual que clarifique si la búsqueda es server-side o client-side, y cuántos resultados se están mostrando.

#### Scenario: Indicador de búsqueda server-side

- **WHEN** se ejecuta búsqueda server-side
- **THEN** el sistema SHALL mostrar mensaje: "Buscando en toda la base de datos..."
- **AND** SHALL mostrar spinner de carga durante la búsqueda
- **AND** SHALL mostrar "X resultados encontrados" al completar

#### Scenario: Indicador de filtrado client-side

- **WHEN** solo hay filtros de dropdown aplicados
- **THEN** el sistema SHALL mostrar "Mostrando X de Y siniestros" (filtrados/total)
- **AND** SHALL NOT mostrar indicadores de búsqueda en progreso
