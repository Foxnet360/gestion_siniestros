## ADDED Requirements

### Requirement: Paginación client-side básica

El system SHALL dividir la lista de claims en páginas de tamaño configurable (default: 50 registros por página) y SHALL permitir navegación entre páginas.

#### Scenario: Visualización de primera página

- **WHEN** se cargan 1352 claims
- **THEN** el sistema SHALL mostrar solo los primeros 50 claims (página 1)
- **AND** SHALL mostrar indicador "Mostrando 1-50 de 1352 registros"

#### Scenario: Navegación a siguiente página

- **WHEN** usuario hace clic en botón "Siguiente"
- **THEN** el sistema SHALL mostrar claims 51-100 (página 2)
- **AND** SHALL actualizar indicador a "Mostrando 51-100 de 1352 registros"

#### Scenario: Navegación a página específica

- **WHEN** usuario ingresa número "5" en campo de página
- **THEN** el sistema SHALL mostrar claims 201-250 (página 5)
- **AND** SHALL actualizar controles de navegación

### Requirement: Controles de navegación de páginas

El system SHALL proporcionar controles de UI para navegar entre páginas: botones Primera, Anterior, Números de página (con rango limitado), Siguiente, Última.

#### Scenario: Botones de navegación básicos

- **WHEN** se muestra la tabla de claims paginada
- **THEN** el sistema SHALL mostrar botones: « Primera, < Anterior, [1] [2] [3] ... [27], Siguiente >, Última »
- **AND** botón "Anterior" SHALL estar disabled en página 1
- **AND** botón "Siguiente" SHALL estar disabled en última página

#### Scenario: Rango de números de página

- **WHEN** hay 27 páginas y usuario está en página 15
- **THEN** el sistema SHALL mostrar rango de páginas: 12 13 14 [15] 16 17 18
- **AND** SHALL mostrar "..." para páginas fuera del rango visible

### Requirement: Persistencia de página durante filtrado

El system SHALL resetear a página 1 cuando cambian los filtros o término de búsqueda para evitar mostrar página vacía.

#### Scenario: Cambio de filtro resetea página

- **WHEN** usuario está en página 5 de 10
- **AND** usuario aplica filtro de "Ramo: AUTOS"
- **THEN** el sistema SHALL resetear a página 1
- **AND** SHALL aplicar el filtro sobre todos los datos

#### Scenario: Nueva búsqueda resetea página

- **WHEN** usuario está en página 3
- **AND** usuario ingresa nuevo término de búsqueda "500"
- **THEN** el sistema SHALL ejecutar búsqueda server-side
- **AND** SHALL mostrar resultados desde página 1

### Requirement: Tamaño de página configurable

El system SHALL permitir al usuario seleccionar tamaño de página: 25, 50, 100 registros por página.

#### Scenario: Cambio de tamaño de página

- **WHEN** usuario selecciona "100 por página" en dropdown
- **THEN** el sistema SHALL recalcular número total de páginas
- **AND** SHALL mostrar 100 registros por página
- **AND** SHALL mantener la página actual o ajustar si es necesario
