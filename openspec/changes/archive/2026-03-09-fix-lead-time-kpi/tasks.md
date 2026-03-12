# Tareas de Implementación: Fix Lead Time KPI

## 1. Actualización de KpiService (Etapas)
- [x] 1.1 Modificar `calculateLeadTimeFromEtapas` en `src/services/KpiService.ts`
- [x] 1.2 Implementar función auxiliar o lógica en línea `isClaimClosed` para verificar si un siniestro está cerrado considerando `etapa_16_fecha`, `etapa_15_fecha`, `estado_interno` y `estado_softseguros`.
- [x] 1.3 Cambiar el filtro estricto de `etapa_1_fecha && etapa_16_fecha` para que valide `etapa_1_fecha && isClaimClosed`.
- [x] 1.4 Lógica de mapeo de fechas de cierre: Asegurarse de utilizar la fecha más certera como fin (`etapa_16` > `etapa_15` > `fecha_ultimo_seguimiento`) para el cálculo de `calculateBusinessDays`.

## 2. Actualización de KpiService (Claims - Fallback)
- [x] 2.1 Modificar `calculateLeadTimeFromClaims` en `src/services/KpiService.ts`
- [x] 2.2 Reemplazar la condición estricta de `fecha_finalizacion` no nula identificando estado cerrado desde el String de `estado_softseguros` o la misma `fecha_finalizacion`/`finalizado=true`.
- [x] 2.3 Utilizar de forma jerárquica `fecha_finalizacion` o `fecha_ultimo_seguimiento` como end date en la función `calculateBusinessDays`.

## 3. Pruebas y Validación
- [x] 3.1 Abrir el Dashboard en entorno local y verificar que el UI de OperationalEfficiencySection ya no muestra 0 en el KPI "Ciclo de Resolución".
- [x] 3.2 Verificar que el KPI logre promediar siniestros incluso si no tienen la etapa 16 en base de datos, con tal de que se encuentren "PAGADO" o "FINALIZADO".
