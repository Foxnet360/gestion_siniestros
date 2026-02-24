## Why

La ingesta de datos desde el archivo Excel de Softseguros no está capturando correctamente el campo "NÚMERO DE SINIESTRO COMPAÑÍA" y potencialmente otros campos. El parser está buscando nombres de columnas que no coinciden exactamente con los del Excel, causando que los datos lleguen vacíos o null a la base de datos.

## What Changes

- Corregir el mapeo de columnas en el Excel parser para que coincida exactamente con los nombres del archivo Softseguros
- Agregar variantes de nombres de columnas (con/sin "DE", diferentes tildes)
- Agregar logging detallado para debug de columnas no encontradas
- Validar que todos los campos requeridos se estén mapeando correctamente

## Capabilities

### Modified Capabilities

- `excel-parser`: Fix column name mapping for numero_siniestro_compania and other fields

## Impact

- Servicio: `services/excelParser.ts`
- Componentes: Ingesta Excel, visualización de datos
- Base de datos: Campos que quedaban vacíos ahora se poblarán correctamente
