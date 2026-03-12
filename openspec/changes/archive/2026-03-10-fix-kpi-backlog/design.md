## Context

El componente `SLATrackingSection.tsx` en el Cuadro de Mando de Siniestros exhibe un porcentaje falso del Backlog de siniestros debido a que la cantidad total de siniestros contra las que se evalúan los casos activos está calculada utilizando un número constante (1461) quemado en el código fuente.

## Goals / Non-Goals

**Goals:**
- Presentar el porcentaje correcto en el Donut Chart basado en los datos devueltos por la API o el backend de base de datos.
- Re-diseñar cómo se alimentan las métricas en la invocación de `<SLATrackingSection backlog={...}/>`.

**Non-Goals:**
- Modificar el backend de `KpiService` (ya realiza su labor con precisión de acorde a las reglas del backlog).
- Reescribir o modificar componentes de gráficos (`DonutChart.tsx`).

## Decisions

**Decisión Técnica:**
Extraer el valor real de `tasas.counts.total` (ya calculado y enviado por la integración de `useKPIs.ts`) u `overview.totalClaims` y usarlo como divisor en lugar del literal numérico "1461".

Dado que `useKPIs` agrupa las solicitudes y devuelve `backlog` (que trae `.total`) y a su vez `tasas` trae la data total (que asila las tasas de retención/desistimientos), podemos calcular el porcentaje como `Math.round((backlog.total / totalSiniestros) * 100)`. Para asegurar consistencia, usaremos el mismo `tasas.counts.total` o un fallback seguro si este viene vacío (para evitar la división por cero).

## Risks / Trade-offs

- **[Riesgo de División por Cero]** → **Mitigación:** Asegurarnos de que el divisor sea siempre `>= 1` a través de un simple operador ternario antes de calcular el porcentaje abierto.
