## Context

El usuario reporta que al buscar por "Número de Siniestro Compañía" (campo `numero_siniestro_compañia`) con el valor "01-56498-2", el sistema no filtra correctamente aunque el dato existe en la base de datos.

Investigación inicial reveló:

1. En `context/ClaimsContext.tsx` línea 363-364, el filtro busca `claim.numero_siniestro_compania`
2. En `types.ts` línea 139, la interfaz Claim define `numero_siniestro_compania?: string`
3. El usuario indica que en la base de datos el campo es `numero_siniestro_compañia` (con ñ)

Esto sugiere una discrepancia entre el nombre del campo en el código TypeScript y el nombre real en la base de datos de Supabase.

## Goals / Non-Goals

**Goals:**

- Corregir el filtrado por número de siniestro compañía para que funcione correctamente
- Asegurar consistencia entre los nombres de campos en código y base de datos
- Mantener la búsqueda case-insensitive y con soporte para valores parciales

**Non-Goals:**

- Modificar la estructura de la base de datos
- Cambiar otros filtros del sistema
- Modificar la UI del dashboard

## Decisions

**Decision: Corregir el nombre del campo en el código**

El campo en la base de datos se llama `numero_siniestro_compañia` (con ñ), pero el código usa `numero_siniestro_compania` (sin ñ).

Opciones consideradas:

1. Renombrar el campo en la base de datos (rechazada - requiere migración de datos)
2. Corregir el código para usar `numero_siniestro_compañia` (seleccionada - mínimo impacto)
3. Agregar un alias en el mapeo de datos (rechazada - agrega complejidad innecesaria)

**Rationale:** La opción 2 es la más segura y rápida. Solo requiere actualizar la interfaz Claim en types.ts y las referencias en ClaimsContext.tsx.

**Decision: Mantener búsqueda case-insensitive**

El filtro actual ya usa `.toLowerCase()` en el término de búsqueda y en el valor del campo, lo cual es correcto y se mantendrá.

**Decision: Mantener búsqueda por coincidencia parcial**

El uso de `.includes()` permite buscar por fragmentos del número, lo cual es útil y se mantendrá.

## Risks / Trade-offs

**[Riesgo] Cambiar el nombre del campo podría afectar otros componentes**
→ Mitigación: Buscar todas las referencias a `numero_siniestro_compania` en el codebase antes de hacer el cambio.

**[Riesgo] Datos existentes podrían tener valores nulos**
→ Mitigación: Mantener el operador de cortocircuito `&&` para verificar que el campo existe antes de llamar `.toLowerCase()`.

## Migration Plan

No requiere migración de datos. El cambio es transparente para los usuarios.

Pasos de implementación:

1. Actualizar `types.ts`: cambiar `numero_siniestro_compania` a `numero_siniestro_compañia`
2. Actualizar `context/ClaimsContext.tsx`: cambiar referencia al campo
3. Verificar que no existan otras referencias al campo antiguo
4. Probar el filtro con el valor "01-56498-2"
