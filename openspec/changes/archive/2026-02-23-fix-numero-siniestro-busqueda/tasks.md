## 1. Análisis y Verificación

- [x] 1.1 Verificar el nombre exacto del campo en Supabase (comparar `numero_siniestro_compania` vs `numero_siniestro_compañia`)
- [x] 1.2 Buscar todas las referencias a `numero_siniestro_compania` en el codebase para identificar archivos a modificar

## 2. Corrección de Tipos

- [x] 2.1 Actualizar `types.ts` línea 139: cambiar `numero_siniestro_compania` a `numero_siniestro_compañia`
- [x] 2.2 Verificar que no hay otros campos con inconsistencias similares

## 3. Corrección de Lógica de Filtrado

- [x] 3.1 Actualizar `context/ClaimsContext.tsx` línea 363: cambiar `claim.numero_siniestro_compania` a `claim.numero_siniestro_compañia`
- [x] 3.2 Verificar que la lógica de búsqueda case-insensitive sigue funcionando correctamente

## 4. Verificación de Otros Usos

- [x] 4.1 Revisar si hay otros componentes o servicios que usen `numero_siniestro_compania`
- [x] 4.2 Actualizar cualquier referencia restante al campo

## 5. Pruebas

- [x] 5.1 Ejecutar `npx tsc --noEmit` para verificar errores de TypeScript
- [x] 5.2 Probar el filtro con el valor "01-56498-2" mencionado por el usuario
- [x] 5.3 Probar búsquedas parciales (ej: "56498")
- [x] 5.4 Verificar que otros filtros siguen funcionando correctamente
