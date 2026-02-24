## Why

El filtro de búsqueda por "Número de Siniestro Compañía" (campo `numero_siniestro_compañia`) en el dashboard no está funcionando correctamente. Aunque el valor existe en la base de datos (ejemplo: "01-56498-2"), no aparece en los resultados de búsqueda. Esto impide a los usuarios localizar siniestros por este campo crítico, afectando la eficiencia operativa del sistema de gestión.

## What Changes

- Corregir la lógica de filtrado del campo `numero_siniestro_compañia` en el dashboard para que realice la búsqueda correctamente
- Verificar que el filtro coincida con valores parciales y completos del número de siniestro compañía
- Asegurar que la búsqueda sea case-insensitive y maneje correctamente los guiones y espacios

## Capabilities

### New Capabilities

- _Ninguna - es corrección de bug existente_

### Modified Capabilities

- `claims-search`: Corregir el filtrado por campo `numero_siniestro_compañia` para que funcione correctamente con valores existentes en la base de datos

## Impact

- **Componentes afectados:** Dashboard, tabla de siniestros, lógica de filtrado
- **Base de datos:** Campo `numero_siniestro_compañia` en tabla de claims
- **API:** Posible ajuste en queries de Supabase para búsqueda por este campo
- **Usuarios:** Operadores del sistema que buscan siniestros por número de compañía
