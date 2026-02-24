---
name: supabase-expert
version: '1.0.0'
description: Especialista en Supabase - experto en consultas, arquitectura de base de datos, y operaciones CRUD. Proporciona mejores prácticas, optimización de queries, y manejo de errores.
author: OpenSpec Team
tags: [supabase, postgresql, database, queries, optimization]
---

# Supabase Expert

Especialista en Supabase para operaciones de base de datos, optimización de consultas y arquitectura.

## Capacidades

- Consultas SELECT, INSERT, UPDATE, DELETE
- Relaciones y JOINs (uno-a-uno, uno-a-muchos, muchos-a-muchos)
- Filtros, ordenamiento y paginación
- Optimización de queries
- Manejo de errores Supabase
- Bulk operations
- Real-time subscriptions
- Row Level Security (RLS)

## Fundamentos

### Cliente Supabase

```typescript
import { supabase } from '../lib/supabase';

// El cliente está configurado en lib/supabase.ts con:
// - URL desde VITE_SUPABASE_URL
// - Anon key desde VITE_SUPABASE_ANON_KEY
```

### Estructura de Consultas Básica

```typescript
const { data, error } = await supabase
  .from('tabla')
  .select('columna1, columna2')
  .eq('campo', valor)
  .single(); // o .maybeSingle() para resultados opcionales

if (error) throw error;
return data;
```

## Patrones Comunes

### 1. Select Básico con Filtros

```typescript
// Múltiples filtros
const { data, error } = await supabase
  .from('claims')
  .select('*')
  .eq('estado', 'PENDIENTE')
  .gte('created_at', fechaInicio)
  .lte('created_at', fechaFin)
  .order('created_at', { ascending: false });

// Búsqueda de texto (ilike para case-insensitive)
const { data } = await supabase.from('claims').select('*').ilike('nombre', '%busqueda%');
```

### 2. Relaciones (JOINs)

```typescript
// Uno-a-muchos con relaciones anidadas
const { data } = await supabase
  .from('claims')
  .select(
    `
    *,
    state_history:state_history(*),
    timeline:timeline(*)
  `
  )
  .eq('id_softseguros', claimId);

// Muchos-a-muchos con tabla intermedia
const { data } = await supabase.from('users').select(`
    *,
    roles:user_roles(
      role:roles(*)
    )
  `);
```

### 3. Bulk Operations (Optimización)

```typescript
// ❌ INEFICIENTE: Muchas queries individuales
for (const id of ids) {
  await supabase.from('history').select('*').eq('claim_id', id);
}

// ✅ OPTIMIZADO: Una sola query con .in()
const { data } = await supabase.from('history').select('*').in('claim_id', ids);

// Crear múltiples registros
const { data } = await supabase
  .from('claims')
  .insert([{ campo1: 'valor1' }, { campo1: 'valor2' }])
  .select();

// Upsert (insert o update)
const { data } = await supabase
  .from('claims')
  .upsert(claimsArray, { onConflict: 'id_softseguros' })
  .select();
```

### 4. Paginación

```typescript
const PAGE_SIZE = 20;
const page = 1;

const { data, count, error } = await supabase
  .from('claims')
  .select('*', { count: 'exact' })
  .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  .order('created_at', { ascending: false });

// Total de páginas
const totalPages = Math.ceil((count || 0) / PAGE_SIZE);
```

### 5. Manejo de Errores

```typescript
try {
  const { data, error } = await supabase.from('claims').select('*');

  if (error) {
    // Error de Supabase (permisos, sintaxis, etc.)
    console.error('Supabase error:', error.message);
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
} catch (err) {
  // Error de red, timeout, etc.
  console.error('Network/Other error:', err);
  throw err;
}
```

## Optimización de Performance

### Estrategias Clave

1. **Evita N+1 queries**: Usa `.in()` para relaciones
2. **Selecciona solo columnas necesarias**: No uses `*` en producción
3. **Usa índices**: Asegúrate de tener índices en columnas de filtro
4. **Limita resultados**: Usa paginación para grandes datasets
5. **Bulk operations**: Insert/update múltiples registros en una operación

### Ejemplo: Cargar Claims con Relaciones Eficientemente

```typescript
// Obtener todos los IDs primero
const { data: claims } = await supabase.from('claims').select('id_softseguros');
const claimIds = claims?.map(c => c.id_softseguros) || [];

if (claimIds.length === 0) return [];

// Cargar todas las relaciones en paralelo con bulk queries
const [{ data: allHistory }, { data: allTimeline }] = await Promise.all([
  supabase.from('state_history').select('*').in('claim_id', claimIds),
  supabase.from('timeline').select('*').in('claim_id', claimIds),
]);

// Crear mapas para lookup O(1)
const historyMap = new Map();
allHistory?.forEach(h => {
  if (!historyMap.has(h.claim_id)) historyMap.set(h.claim_id, []);
  historyMap.get(h.claim_id).push(h);
});

const timelineMap = new Map();
allTimeline?.forEach(t => {
  if (!timelineMap.has(t.claim_id)) timelineMap.set(t.claim_id, []);
  timelineMap.get(t.claim_id).push(t);
});

// Combinar
return claims.map(claim => ({
  ...claim,
  stateHistory: historyMap.get(claim.id_softseguros) || [],
  timeline: timelineMap.get(claim.id_softseguros) || [],
}));
```

## Row Level Security (RLS)

### Políticas Comunes

```sql
-- Permitir lectura solo de claims del usuario
CREATE POLICY "Users can view their own claims"
  ON claims FOR SELECT
  USING (auth.uid() = user_id);

-- Permitir lectura basada en rol
CREATE POLICY "Aliados view only their claims"
  ON claims FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    ) OR aliado_origen = (
      SELECT aliado_id FROM users WHERE users.id = auth.uid()
    )
  );
```

## Errores Comunes y Soluciones

| Error                                                   | Causa                        | Solución                             |
| ------------------------------------------------------- | ---------------------------- | ------------------------------------ |
| `invalid input syntax for type uuid`                    | ID no es formato UUID válido | Validar formato antes de query       |
| `operator does not exist: text = uuid`                  | Comparando texto con UUID    | Castear: `.eq('id', uuid as string)` |
| `null value in column "x" violates not-null constraint` | Campo requerido es null      | Validar datos antes de insert        |
| `duplicate key value violates unique constraint`        | Violación de unique          | Usar `.upsert()` o manejar conflicto |
| `JWT expired`                                           | Token expirado               | Refrescar sesión o re-autenticar     |
| `new row violates row-level security policy`            | RLS bloqueando               | Verificar políticas RLS              |
| `ERR_INSUFFICIENT_RESOURCES`                            | Demasiadas queries           | Usar bulk operations                 |

## Naming Conventions

- **Tablas**: plural, snake_case (`claims`, `state_history`)
- **Columnas**: snake_case (`id_softseguros`, `numero_siniestro`)
- **Foreign keys**: `{tabla}_id` (`claim_id`, `user_id`)
- **Timestamps**: `created_at`, `updated_at`

## Consultas Avanzadas

### Funciones RPC

```typescript
// Llamar a función PostgreSQL personalizada
const { data } = await supabase.rpc('nombre_funcion', {
  param1: valor1,
  param2: valor2,
});
```

### Filtros Complejos

```typescript
// OR conditions
const { data } = await supabase
  .from('claims')
  .select('*')
  .or('estado.eq.PENDIENTE,estado.eq.EN_PROCESO');

// AND con OR anidado
const { data } = await supabase
  .from('claims')
  .select('*')
  .eq('aseguradora', 'SURA')
  .or('ramo.eq.AUTOS,ramo.eq.HOGAR');
```

### Text Search

```typescript
// Búsqueda full-text (requiere índice)
const { data } = await supabase.from('claims').select('*').textSearch('descripcion', 'siniestro', {
  type: 'websearch',
  config: 'spanish',
});
```

## Real-time Subscriptions

```typescript
// Suscribirse a cambios
const subscription = supabase
  .channel('claims_channel')
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'claims',
    },
    payload => {
      console.log('Change received:', payload);
    }
  )
  .subscribe();

// Limpiar
supabase.removeChannel(subscription);
```

## Checklist de Buenas Prácticas

- [ ] Validar datos antes de enviar a Supabase
- [ ] Manejar errores explícitamente
- [ ] Usar `.single()` solo cuando esperas exactamente un resultado
- [ ] Usar `.maybeSingle()` para resultados opcionales
- [ ] Implementar paginación para listados grandes
- [ ] Optimizar relaciones con bulk queries
- [ ] Agregar índices en columnas de filtro frecuente
- [ ] Configurar RLS apropiadamente
- [ ] Limitar columnas seleccionadas (no usar `*` en producción)
- [ ] Usar transacciones para operaciones atómicas

## Recursos

- [Supabase JavaScript Reference](https://supabase.com/docs/reference/javascript)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgREST API](https://postgrest.org/en/stable/)
