# Specs: Visualizar Casos con Riesgo de Prescripción

## ADDED Requirements

### Requirement: Acceso a Vista de Riesgo
El sistema debe permitir acceder a una vista dedicada para los casos en riesgo de prescripción desde la alerta correspondiente.

#### Scenario: Redirección desde Alerta
- **WHEN** El usuario hace clic en el botón "Ver casos" dentro de la alerta de "Riesgo de Prescripción detectado".
- **THEN** El sistema navega a la ruta `/siniestros/riesgo-prescripcion` (o similar).
- **THEN** Se muestra la vista "Casos Próximos a Prescribir".

### Requirement: Listado y Ordenamiento
La vista debe listar los casos ordenados por urgencia.

#### Scenario: Visualización Inicial
- **WHEN** Carga la vista de casos en riesgo.
- **THEN** Se listan todos los casos que cumplen con el criterio de prescripción (próximos a 2 años).
- **THEN** Los casos se ordenan ascendentemente por `fecha_prescripcion` (o fecha de siniestro + 2 años), mostrando primero los más cercanos a vencer.
- **THEN** Se muestra el total de casos en la cabecera o pie de página.

### Requirement: Filtros Dinámicos
El usuario debe poder segmentar la lista mediante múltiples filtros.

#### Scenario: Filtrado de Casos
- **WHEN** El usuario selecciona un valor en uno o más de los siguientes filtros:
  - Cliente (Compañía)
  - Estado del caso
  - Ramo
  - Aseguradora
  - Estado (Ubicación/Admin)
  - Técnico
  - Vendedor
- **THEN** El listado se actualiza mostrando solo los registros que coinciden con TODOS los filtros aplicados.
- **THEN** El contador de "Total de casos" se actualiza acorde a los resultados filtrados.
