# Propuesta para fix-lead-time-kpi

## Resumen Ejecutivo
El KPI de "Ciclo de Resolución" (Lead Time) actualmente muestra 0 días hábiles en la mayoría de los casos o falla al calcular. Esta propuesta plantea modificar la lógica en `KpiService.ts` para que el cálculo sea más resiliente, apoyándose en cualquier etapa de cierre o en el estado interno del siniestro, en lugar de depender estrictamente de la etapa 16 (Pagado).

## Motivación
Actualmente, el dashboard gerencial no refleja correctamente el tiempo de resolución promedio. El cálculo estricto asume que todos los siniestros finalizados tienen una fecha explícita para la "etapa 16" (Pagado) proveniente del parser de observaciones. Dado que en la vida real la ingestión de SoftSeguros a veces marca casos como "Finalizado" sin un texto exacto de "PAGADO", el código no encuentra casos "completados" y el promedio cae a 0. Esto impide a la gerencia medir y mejorar la eficiencia operativa.

## Solución Propuesta
Modificar `src/services/KpiService.ts` en las funciones `calculateLeadTimeFromEtapas` y `calculateLeadTimeFromClaims` para:
1. Ampliar el criterio de "siniestro completado" para incluir: etapa 15 (Finalizado), etapa 16 (Pagado), o que el `estado_softseguros`/`estado_interno` indique cierre.
2. Usar como fecha fin de ciclo la fecha de etapa 16 si existe, si no la etapa 15, y como último recurso la `fecha_ultimo_seguimiento` o `fecha_finalizacion` vinculada al caso si el estado general es cerrado.

## Impacto
- **Sistemas Afectados:** El servicio de KPIs (`KpiService.ts`).
- **Beneficios:** El dashboard mostrará tiempos de resolución reales usando la data histórica y actual, funcionando de inmediato tras el despliegue.
- **Riesgos:** Las métricas históricas pueden tener variaciones (ej. usar `fecha_ultimo_seguimiento` como cierre estimado) pero será más preciso que mostrar 0. No hay riesgo de corrupción de datos base ya que no se altera esquema ni lógica de base de datos.
