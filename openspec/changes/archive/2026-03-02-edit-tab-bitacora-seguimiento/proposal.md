## Why

El sistema actual de gestión de siniestros requiere una forma más estructurada de actualizar el seguimiento de cada registro. Los funcionarios necesitan poder editar información clave y, simultáneamente, mantener un historial auditable de todos los cambios realizados mediante una bitácora automática que capture quién hizo el cambio, cuándo y qué estado tenía el siniestro en ese momento.

## What Changes

- **Nueva pestaña "Editar"**: Crear una nueva pestaña en la vista de detalle de siniestros que permita la edición de campos de seguimiento
- **Formulario pre-diligenciado**: Al seleccionar un registro, la pestaña debe cargar automáticamente los datos existentes del siniestro
- **Reubicación del botón Guardar**: El botón de guardar debe estar asociado funcionalmente al registro de un nuevo evento en la bitácora
- **Actualización de campo de fecha**: Al guardar, el sistema debe actualizar el campo "Próxima Fecha de ÚLTIMO SEGUIMIENTO"
- **Generación automática de bitácora**: Crear un nuevo registro en el historial/bitácora con formato estructurado al momento de guardar los cambios
- **Formato de bitácora estricto**: La entrada en bitácora debe seguir el patrón: `Fecha: [Fecha Actual] - Funcionario: [Usuario Logueado] - Seg: "[Estado Seleccionado]" [Descripción del usuario]`

## Capabilities

### New Capabilities

- `edit-tab`: Implementación de pestaña de edición para siniestros con formulario pre-cargado
- `bitacora-tracking`: Sistema de bitácora automática que genera entradas formateadas con fecha, funcionario, estado y descripción al guardar cambios
- `tracking-date-update`: Actualización automática del campo "Próxima Fecha de ÚLTIMO SEGUIMIENTO" al realizar un seguimiento

### Modified Capabilities

- _(ninguna capacidad existente requiere cambios en sus requisitos específicos)_

## Impact

### Frontend (React Components)

- Componente `ClaimDetail.tsx` o similar - agregar nueva pestaña "Editar"
- Nuevo componente `EditTrackingForm.tsx` - formulario para edición de seguimiento
- Componente `Timeline.tsx` o bitácora existente - mostrar nuevas entradas generadas

### Backend / Database

- Tabla `timeline` o `bitacora` - inserción de nuevos registros con formato específico
- Tabla `claims` - actualización del campo `fecha_ultimo_seguimiento` o similar
- Potencialmente tabla de usuarios para obtener nombre del funcionario logueado

### Services / Business Logic

- Nuevo servicio para generar string de bitácora formateado
- Servicio para actualizar claim y crear entrada de bitácora en una operación atómica

### APIs

- Endpoint para obtener datos del siniestro (ya existente, posiblemente reutilizable)
- Endpoint POST/PUT para actualizar seguimiento y generar bitácora

### User Experience

- Los funcionarios verán una nueva pestaña disponible al visualizar un siniestro
- El formulario mostrará los datos actuales del siniestro pre-cargados
- Al guardar, el sistema mostrará confirmación y el nuevo registro aparecerá en la bitácora
