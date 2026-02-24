## Why

El sistema actual solo carga 1000 registros de Supabase (límite por defecto), pero la base de datos contiene 1352+ claims. Cuando los usuarios buscan claims específicos como "633" o "01-56498 -2", no los encuentran porque están fuera del primer lote de 1000 registros cargados. La búsqueda es client-side sobre datos parciales, lo que produce resultados incorrectos y una mala experiencia de usuario.

## What Changes

- Implementar **búsqueda server-side** para buscar en toda la base de datos, no solo en los registros cargados
- Agregar **paginación client-side** con navegación entre páginas (50 registros por página)
- Optimizar carga de relaciones (state_history, timeline) solo para claims visibles
- Aumentar límite de carga inicial de 1000 a 2000 registros como medida temporal
- Crear hook `usePagination` para manejo de estado de paginación
- Crear componente `Pagination` para UI de navegación
- Modificar `ClaimsContext` para soportar búsqueda híbrida (server-side + client-side)

## Capabilities

### New Capabilities

- `server-side-search`: Búsqueda en base de datos PostgreSQL usando operadores ILIKE para campos de texto
- `client-pagination`: Paginación client-side con navegación entre páginas y control de tamaño de página
- `pagination-hooks`: Hook reutilizable `usePagination` para manejo de estado de paginación en cualquier lista

### Modified Capabilities

- `claims-filtering`: Extender para soportar búsqueda server-side cuando hay término de búsqueda, manteniendo filtrado client-side para filtros de dropdown

## Impact

**Archivos modificados:**

- `context/ClaimsContext.tsx`: Lógica de búsqueda híbrida y fetch de claims
- `components/Dashboard.tsx`: Integrar paginación y manejo de búsqueda
- `components/ClaimsTable.tsx`: Opcional - mostrar información de paginación

**Archivos nuevos:**

- `hooks/usePagination.ts`: Hook de paginación reutilizable
- `components/common/Pagination.tsx`: Componente de navegación de páginas

**Base de datos:**

- Recomendado: Agregar índices en Supabase para campos de búsqueda frecuentes (`numero_siniestro`, `numero_siniestro_compania`, `asegurado`, `poliza`)

**UX:**

- Los KPIs seguirán mostrando datos de todos los claims filtrados (no solo la página actual)
- Los filtros de dropdown (Ramo, Aseguradora, Estado) seguirán funcionando sobre todos los datos cargados
- Búsquedas con menos de 3 caracteres mostrarán mensaje indicando que se requieren más caracteres
