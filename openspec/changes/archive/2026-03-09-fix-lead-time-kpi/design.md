# Diseño Técnico: Fix Lead Time KPI

## Contexto
El cálculo actual del KPI "Ciclo de Resolución" (Lead Time) es estricto y asume que todos los siniestros finalizados pasan siempre por las etapas explícitas 1 y 16 almacenadas en la base de datos a través de `siniestro_etapas` o tienen un `fecha_finalizacion` preciso en `claims`. En la realidad, la data muestra cierres ambiguos documentados solo con estados ("FINALIZADO", "PAGADO") o registrados hasta la etapa 15. Esto resulta en que el dashboard indique 0 días como promedio.

## Objetivos
- Relajar los filtros de siniestro "completado" para incluir aquellos que han alcanzado la etapa 15, etapa 16 o cuyo estado denota cierre ("PAGADO", "FINALIZADO").
- Mejorar el cálculo de días hábiles (`calculateBusinessDays`) para usar la fecha más realista disponible de cierre, dando prioridad en orden: etapa 16 -> etapa 15 -> fecha_ultimo_seguimiento / fecha_finalizacion.
- No alterar la base de datos, solo la capa de servicio (`KpiService.ts`).

## No Objetivos
- No crearán scripts SQL adicionales de migración de datos.
- No cambiar cálculo del dashboard para otros KPIs o UI fuera del `OperationalEfficiencySection`.
- No alterar ingestión de archivos Excel.

## Arquitectura / Flujo de Datos
Actualmente en `src/services/KpiService.ts`:
1. `getLeadTime` llama a `calculateLeadTimeFromEtapas` o `calculateLeadTimeFromClaims`.
2. Estas funciones filtran las listas estrictamente `filter(e => e.etapa_1_fecha && e.etapa_16_fecha)`.
3. Calculan los días usando `calculateBusinessDays(start, end)`.

Nuevo Flujo:
Se extraerá una función o lógica que determine de forma inteligente `getClaimCloseDate(claim o etapa)` y verifique `isClaimClosed(claim o etapa)`.

## Detalles de Implementación

En `src/services/KpiService.ts`:

**Modificación 1: `calculateLeadTimeFromEtapas`**
Reemplazar:
```typescript
const completedClaims = etapas.filter(e => e.etapa_1_fecha && e.etapa_16_fecha);
```
Por:
```typescript
const isClaimClosed = (e: any) => {
  if (e.etapa_16_fecha || e.etapa_15_fecha) return true;
  if (e.claims && e.claims.estado_interno === 'FINALIZADO') return true;
  if (e.claims && e.claims.estado_softseguros && 
     (e.claims.estado_softseguros.toUpperCase().includes('PAGADO') || 
      e.claims.estado_softseguros.toUpperCase().includes('FINALIZADO'))) return true;
  return false;
};

const completedClaims = etapas.filter(e => e.etapa_1_fecha && isClaimClosed(e));
```

Ajustar el cálculo de días:
```typescript
const leadTimes = completedClaims
  .map(e => {
    const endDate = e.etapa_16_fecha || e.etapa_15_fecha || (e.claims ? e.claims.fecha_ultimo_seguimiento : null);
    if (!endDate) return null;
    return this.calculateBusinessDays(e.etapa_1_fecha, endDate);
  })
  .filter(val => val !== null) as number[];
```

**Modificación 2: `calculateLeadTimeFromClaims` (El método de fallback)**
Modificar su lógica para alinearla con la verificación de estado cerrado, usando `fecha_aviso` y como finalización `fecha_finalizacion` o `fecha_ultimo_seguimiento`.

## Riesgos y Trade-offs
- **Precisión vs Funcionalidad**: Utilizar la `fecha_ultimo_seguimiento` como fecha de finalización para siniestros cerrados podría aportar un pequeño sesgo si el usuario marcó "Finalizado" tiempo después de que el caso se consideró resuelto. Sin embargo, este delta es mucho más valioso en analítica que mantener un promedio total en 0.
