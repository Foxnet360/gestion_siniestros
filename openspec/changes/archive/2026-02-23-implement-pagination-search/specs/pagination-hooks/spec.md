## ADDED Requirements

### Requirement: Hook usePagination reutilizable

El system SHALL proporcionar un hook `usePagination<T>` que reciba un array de items y un tamaño de página, y retorne el subconjunto paginado junto con controles de navegación.

#### Scenario: Uso básico del hook

- **WHEN** se llama `usePagination(claims, 50)`
- **THEN** el hook SHALL retornar:
  - `paginatedItems`: array con items de la página actual
  - `currentPage`: número de página actual (default: 1)
  - `totalPages`: número total de páginas
  - `goToPage(page)`: función para ir a página específica
  - `nextPage()`: función para ir a siguiente página
  - `prevPage()`: función para ir a página anterior
  - `hasNextPage`: boolean indicando si hay página siguiente
  - `hasPrevPage`: boolean indicando si hay página anterior

#### Scenario: Cambio de items actualiza paginación

- **WHEN** el array de items cambia (ej: aplicar filtro)
- **THEN** el hook SHALL recalcular `totalPages`
- **AND** SHALL ajustar `currentPage` si es mayor que el nuevo total
- **AND** SHALL retornar `paginatedItems` actualizado

### Requirement: Memoización de resultados paginados

El hook usePagination SHALL usar useMemo para evitar recálculos innecesarios cuando ni items ni página cambian.

#### Scenario: Re-render sin cambios

- **WHEN** componente padre re-renderiza pero items y currentPage no cambian
- **THEN** el hook SHALL retornar la misma referencia de `paginatedItems` (memoizado)
- **AND** componentes hijos no SHALL re-renderizar innecesariamente

### Requirement: Reset automático al cambiar tamaño de página

El hook SHALL aceptar un parámetro opcional `resetOnPageSizeChange` (default: true) que resetee a página 1 cuando cambia el tamaño de página.

#### Scenario: Cambio de pageSize sin reset

- **WHEN** usuario cambia tamaño de página de 50 a 100
- **AND** `resetOnPageSizeChange` es false
- **THEN** el hook SHALL mantener `currentPage` (ej: página 5)
- **AND** SHALL mostrar items 201-400 en lugar de 1-100

#### Scenario: Cambio de pageSize con reset

- **WHEN** usuario cambia tamaño de página de 50 a 100
- **AND** `resetOnPageSizeChange` es true (default)
- **THEN** el hook SHALL resetear `currentPage` a 1
- **AND** SHALL mostrar items 1-100
