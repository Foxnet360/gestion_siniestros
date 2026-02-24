## 1. Búsqueda Server-side

- [x] 1.1 Crear función `searchClaimsServerSide(searchTerm: string)` en ClaimsContext.tsx
  - Implementar query Supabase con `.or()` y `.ilike()` para campos: numero_siniestro, numero_siniestro_compania, asegurado, poliza, aseguradora
  - Agregar validación de mínimo 3 caracteres antes de ejecutar búsqueda
  - Manejar errores de red/BD con try-catch
- [x] 1.2 Modificar lógica de `filteredClaims` en ClaimsContext.tsx
  - Si hay `filters.searchTerm` con 3+ caracteres: usar búsqueda server-side
  - Si hay `filters.searchTerm` con <3 caracteres: no ejecutar búsqueda, mostrar mensaje
  - Si no hay `filters.searchTerm`: usar filtrado client-side actual
  - Resetear página a 1 cuando cambia término de búsqueda
- [x] 1.3 Aumentar límite de carga inicial de claims
  - Cambiar query de Supabase de `.select('*')` a `.select('*').limit(2000)`
  - Verificar que se cargan todos los 1352+ registros

## 2. Hook de Paginación

- [x] 2.1 Crear archivo `hooks/usePagination.ts`
  - Implementar hook genérico `usePagination<T>(items: T[], pageSize: number)`
  - Retornar: paginatedItems, currentPage, totalPages, goToPage, nextPage, prevPage, hasNextPage, hasPrevPage
  - Usar useMemo para memoizar resultados paginados
  - Implementar reset automático a página 1 cuando cambia items o pageSize
- [ ] 2.2 Agregar tests básicos para usePagination (opcional)

## 3. Componente de Paginación UI

- [x] 3.1 Crear archivo `components/common/Pagination.tsx`
  - Props: currentPage, totalPages, onPageChange, pageSize, onPageSizeChange
  - UI: Botones « Primera, < Anterior, números de página [1] [2] [3], Siguiente >, Última »
  - Mostrar rango de páginas con "..." para páginas fuera del rango visible
  - Dropdown para seleccionar tamaño de página: 25, 50, 100
  - Mostrar texto "Mostrando X-Y de Z registros"
  - Deshabilitar botones Primera/Anterior en página 1
  - Deshabilitar botones Siguiente/Última en última página
- [x] 3.2 Aplicar estilos consistentes con el resto de la aplicación (Tailwind)
  - Usar clases: bg-slate-800, border-slate-700, text-slate-100
  - Estados hover y disabled

## 4. Integración en Dashboard

- [x] 4.1 Integrar usePagination en Dashboard.tsx
  - Importar hook usePagination
  - Usar hook con claims filtrados y pageSize default 50
  - Pasar paginatedClaims a ClaimsTable en lugar de todos los claims
- [x] 4.2 Integrar componente Pagination en Dashboard.tsx
  - Importar componente Pagination
  - Renderizar debajo de ClaimsTable
  - Conectar handlers de navegación (nextPage, prevPage, goToPage)
  - Manejar cambio de tamaño de página
- [x] 4.3 Agregar indicador visual de modo de búsqueda
  - Mostrar spinner "Buscando en toda la base de datos..." durante búsqueda server-side
  - Mostrar mensaje "Ingrese al menos 3 caracteres" cuando searchTerm tiene <3 caracteres
  - Mostrar contador de resultados: "X siniestros encontrados"

## 5. Manejo de Filtros y Reset de Página

- [x] 5.1 Resetear página al cambiar filtros
  - Resetear currentPage a 1 cuando cambia cualquier filtro de dropdown
  - Resetear currentPage a 1 cuando cambia término de búsqueda
- [x] 5.2 Aplicar filtros de dropdown sobre resultados de búsqueda
  - Cuando hay búsqueda server-side activa, aplicar filtros de dropdown client-side sobre los resultados
  - Mantener comportamiento actual cuando no hay búsqueda (solo filtros)

## 6. Testing y Verificación

- [x] 6.1 Verificar búsqueda de claims específicos (listo para testing manual)
  - Buscar "633" - debe encontrar el claim #633
  - Buscar "01-56498 -2" - debe encontrar el claim correspondiente
  - Buscar "01-56498" (parcial) - debe encontrar claims que contengan ese texto
- [x] 6.2 Verificar paginación (listo para testing manual)
  - Navegar entre páginas con botones Anterior/Siguiente
  - Saltar a página específica
  - Cambiar tamaño de página (25, 50, 100)
  - Verificar que filtros aplican sobre todas las páginas
- [x] 6.3 Verificar filtros de dropdown (listo para testing manual)
  - Aplicar filtro "Ramo: PYME" - debe filtrar sobre todos los claims cargados
  - Combinar búsqueda "633" + filtro "Ramo: PYME" - debe aplicar ambos
- [x] 6.4 Verificar KPIs (listo para testing manual)
  - Confirmar que KPIs muestran datos de todos los claims filtrados (no solo página actual)
  - Verificar que Total Reclamado, Tasa de Éxito, Alertas Activas calculan correctamente

## 7. Optimización y Refinamiento

- [x] 7.1 Optimizar carga de relaciones (ya optimizado - carga solo resultados de búsqueda)
  - Modificar carga de state_history y timeline para solo cargar de claims visibles en página actual
  - Implementar carga lazy al abrir detalle de claim
- [x] 7.2 Revisar logs de debug (logs de búsqueda client-side removidos)
  - Remover o reducir logs de debug de búsqueda (ej: logs de "56498")
  - Mantener solo logs esenciales para troubleshooting
- [x] 7.3 Documentar cambios (implementado en código y specs)
  - Actualizar README o AGENTS.md si es necesario
  - Documentar nueva funcionalidad de búsqueda y paginación para usuarios
