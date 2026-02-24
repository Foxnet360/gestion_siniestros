## Context

El sistema actual carga todos los claims desde Supabase usando `.select('*')` sin límite explícito, lo que resulta en un límite implícito de 1000 registros (comportamiento por defecto de Supabase/PostgREST). Con 1352+ registros en la base de datos, esto significa que aproximadamente 350 claims nunca se cargan en la aplicación.

Cuando los usuarios intentan buscar claims específicos (como el #633 o "01-56498 -2"), la búsqueda se realiza client-side sobre el array de claims cargados. Si el claim buscado está en los registros no cargados (índice 1000+), no se encuentra, produciendo una experiencia de usuario frustrante y datos aparentemente "perdidos".

### Estado Actual

- **Claims totales en BD**: 1352+
- **Claims cargados**: 1000 (límite implícito)
- **Tipo de búsqueda**: Client-side (JavaScript filter)
- **Problema**: Claims #633 y "01-56498 -2" están en registros 1000-1352, no se encuentran

### Arquitectura Actual

```
Supabase (1352 registros)
    │
    │ SELECT * FROM claims
    │ (limit 1000 implícito)
    ▼
[1000 claims en ClaimsContext]
    │
    │ filteredClaims = claims.filter(...)
    │ (client-side search)
    ▼
Dashboard (sólo ve 1000 claims)
```

## Goals / Non-Goals

**Goals:**

1. Permitir búsqueda de cualquier claim en toda la base de datos (1352+ registros)
2. Implementar paginación client-side para mejorar performance de renderizado
3. Mantener filtros de dropdown funcionando sobre todos los datos cargados
4. Proveer experiencia de usuario fluida con loading states claros
5. Optimizar carga de relaciones (state_history, timeline) para no cargar datos innecesarios

**Non-Goals:**

1. No implementar paginación server-side (limit/offset en queries) - se mantiene carga de todos los registros
2. No cambiar la arquitectura de KPIs - siguen calculándose sobre todos los claims filtrados
3. No agregar índices de base de datos (recomendación separada)
4. No modificar la UI de filtros de dropdown (mantener comportamiento actual)

## Decisions

### 1. Búsqueda Híbrida (Server-side + Client-side)

**Decision**: Implementar búsqueda server-side solo cuando hay término de búsqueda de texto; mantener filtrado client-side para filtros de dropdown.

**Rationale**:

- Los filtros de dropdown (Ramo, Aseguradora, Estado) funcionan bien client-side porque operan sobre campos categóricos con valores finitos
- La búsqueda de texto necesita buscar en toda la BD porque los valores son únicos y pueden estar en cualquier posición
- Dividir responsabilidades simplifica la lógica y mantiene performance

**Alternativas consideradas**:

- Búsqueda server-side para todo: Requeriría múltiples queries complejas, más lento
- Solo búsqueda client-side: No resuelve el problema de claims fuera del límite de 1000

### 2. Paginación Client-side con Carga Completa

**Decision**: Cargar todos los registros (aumentando límite a 2000) pero paginar client-side para renderizado.

**Rationale**:

- Con 1352 registros actuales y crecimiento moderado, cargar todos es factible
- Paginación mejora performance de renderizado y UX
- Más simple que implementar paginación server-side con limit/offset

**Alternativas consideradas**:

- Paginación server-side (limit/offset): Más compleja, rompe cálculo de KPIs sobre todos los datos
- Infinite scroll: No permite navegación rápida a página específica

### 3. Tamaño de Página Default: 50 registros

**Decision**: 50 registros por página como default.

**Rationale**:

- Balance entre cantidad visible y performance de renderizado
- Con tablas de 13 columnas, 50 filas es manejable sin scroll excesivo
- 1352 registros = 27 páginas, navegable con controles de paginación

### 4. Hook usePagination Genérico

**Decision**: Crear hook reutilizable `usePagination<T>` en lugar de lógica inline.

**Rationale**:

- Puede reusarse en otras listas del sistema (amparos, timeline, etc.)
- Facilita testing y mantenimiento
- Separa lógica de paginación de componentes UI

### 5. Longitud Mínima de Búsqueda: 3 caracteres

**Decision**: Requerir al menos 3 caracteres para ejecutar búsqueda server-side.

**Rationale**:

- Búsquedas con 1-2 caracteres retornan demasiados resultados (ineficiente)
- 3 caracteres es suficiente para números de siniestro específicos
- Reduce carga innecesaria en la base de datos

## Risks / Trade-offs

| Risk                                           | Impact | Mitigation                                                                                                                                         |
| ---------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Performance de carga inicial**               | Alto   | Aumentar límite a 2000 aumenta tiempo de carga inicial. Mitigación: Lazy loading de relaciones (state_history, timeline) solo para claims visibles |
| **UX durante búsqueda server-side**            | Medio  | Búsquedas pueden tardar 500ms-2s. Mitigación: Loading states claros, spinner, mensajes informativos                                                |
| **Complejidad de lógica híbrida**              | Medio  | Dos modos de búsqueda (server vs client) pueden confundir. Mitigación: Indicadores visuales claros de modo activo                                  |
| **Límite de 2000 puede volverse insuficiente** | Bajo   | Si la BD crece a >2000 claims, el problema vuelve. Mitigación: Monitorear crecimiento, considerar paginación server-side real si es necesario      |
| **Supabase ILIKE sin índices es lento**        | Medio  | Búsquedas textuales sin índices pueden escanear toda la tabla. Mitigación: Recomendar índices en campos de búsqueda frecuentes                     |

## Migration Plan

### Fase 1: Búsqueda Server-side (Inmediata)

1. Implementar función `searchClaimsServerSide()` en ClaimsContext
2. Modificar lógica de `filteredClaims` para usar búsqueda server-side cuando hay searchTerm
3. Aumentar límite de carga a 2000 registros
4. Testing: Verificar que búsquedas de "633" y "01-56498 -2" funcionan

### Fase 2: Paginación Client-side (Después de Fase 1)

1. Crear hook `usePagination.ts`
2. Crear componente `Pagination.tsx`
3. Integrar paginación en Dashboard
4. Testing: Verificar navegación entre páginas, filtros funcionan con paginación

### Fase 3: Optimización de Relaciones (Opcional)

1. Modificar carga de state_history y timeline para solo cargar de claims visibles
2. Implementar lazy loading al abrir detalle de claim

### Rollback Strategy

Si hay problemas:

1. Revertir cambios en ClaimsContext (volver a lógica original)
2. Mantener cambios UI (paginación) - no afectan funcionalidad
3. Considerar aumentar límite a 5000+ como solución temporal

## Open Questions

1. **Índices de BD**: ¿Deberíamos crear índices en Supabase para `numero_siniestro`, `numero_siniestro_compania`, etc.? (Recomendado pero fuera del scope de código)

2. **Búsqueda parcial de ID**: ¿Debería incluir `id_softseguros` en la búsqueda server-side? Los usuarios actualmente pueden buscar por ID.

3. **Frecuencia de búsqueda**: ¿Qué tan frecuente es la búsqueda vs el uso de filtros? Esto afecta la prioridad de optimización.

4. **Crecimiento de datos**: ¿Cuál es la tasa de crecimiento esperada? ¿Alcanzaremos 2000+ claims pronto?
