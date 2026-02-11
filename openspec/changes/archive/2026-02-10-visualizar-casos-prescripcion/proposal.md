# Proposal: Visualizar Casos con Riesgo de Prescripción

## Summary
Implementar una vista dedicada para listar y gestionar casos que están próximos a cumplir el plazo de prescripción de 2 años, accesible desde el botón "Ver casos" en la alerta correspondiente.

## Problem
Actualmente, los usuarios carecen de una herramienta eficiente para identificar y priorizar rápidamente los casos que están a punto de prescribir. Esto aumenta el riesgo de que los casos venzan sin ser gestionados, lo que podría acarrear pérdidas económicas o legales para la compañía y los clientes. La falta de una vista ordenada y filtrable dificulta la gestión proactiva.

## Solution
Desarrollar una nueva funcionalidad que redirija al usuario a una vista específica al hacer clic en "Ver casos". Esta vista tendrá las siguientes características:
- **Listado de Casos:** Mostrará el total de casos registrados que cumplan con los criterios de riesgo.
- **Ordenamiento:** Los casos se mostrarán ordenados de forma ascendente por fecha de vencimiento (los más urgentes primero).
- **Priorización Visual:** Resaltar los casos críticos.
- **Filtros Dinámicos:** Implementar filtros para segmentar la información por:
    - Cliente (Compañía)
    - Estado del caso
    - Ramo
    - Aseguradora
    - Estado (Geográfico/Administrativo)
    - Técnico asignado
    - Vendedor

Esto permitirá a los gestores focalizar sus esfuerzos en los casos más urgentes.

## Risks & Alternatives
- **Riesgo:** Si el volumen de casos históricos es muy grande, la carga de la vista podría ser lenta sin una paginación o indexación adecuada en el backend.
- **Alternativa:** Generar un reporte estático exportable a Excel. (Descartado: No permite la gestión ágil e interactiva dentro del sistema).
- **Alternativa:** Modificar el listado general de siniestros para incluir estos filtros. (Descartado: Se prefiere una vista focalizada para esta alerta crítica para no sobrecargar la vista principal).
