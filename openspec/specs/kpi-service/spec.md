# Especificación: KPI Service

## Visión General
El servicio `KpiService.ts` calcula el Lead Time de los siniestros basándose en las fechas de inicio (etapa 1 / aviso) y fin (etapa 16 / finalización). Esta especificación define cómo flexibilizar la regla de "siniestro completado".

## Requisitos y Comportamiento Esperado

### 1. Cálculo a partir de `siniestro_etapas` (Vía Directa)
Cuando el dashboard tiene registros válidos en la tabla `siniestro_etapas`:
- **Un siniestro se considera finalizado SI cumple alguna de estas condiciones:**
  - Tiene `etapa_16_fecha` (Pagado).
  - Tiene `etapa_15_fecha` (Finalizado).
  - El campo `estado_interno` en la entidad anidada `claims` es explícitamente "FINALIZADO".
  - El campo `estado_softseguros` en `claims` contiene la palabra "PAGADO" o "FINALIZADO" (ignorando mayúsculas/minúsculas).
- **Fecha Cero (Inicio del ciclo):** Debe ser siempre `etapa_1_fecha` o `fecha_aviso` del claim. (Se descartan los que no lo tengan).
- **Fecha Fin del Ciclo:** Debe utilizarse la prioridad más alta disponible:
  1. `etapa_16_fecha`
  2. `etapa_15_fecha`
  3. `claims.fecha_ultimo_seguimiento` (Si está en un estado cerrado pero no se halló fecha de etapa específica).

### 2. Cálculo a partir de `claims` (Vía Fallback)
Cuando el cálculo cae en el método alternativo que toma directamente la tabla `claims` (porque no se ha poblado `siniestro_etapas`):
- **Un siniestro se considera finalizado SI:**
  - El `estado_softseguros` incluye las palabras "FINALIZADO", "PAGADO", "PAGO".
  - O si `finalizado` es `true`.
  - O si `fecha_finalizacion` no es null.
- **Fecha Cero:** Debe ser `fecha_aviso`.
- **Fecha Fin del Ciclo:** Prioridad en:
  1. `fecha_finalizacion`
  2. `fecha_ultimo_seguimiento`

## Cambios Técnicos en el Servicio
Modificar el archivo `src/services/KpiService.ts`.

- **Método `calculateLeadTimeFromEtapas`:**
  - Cambiar el `.filter(e => e.etapa_1_fecha && e.etapa_16_fecha)` por un filtro enriquecido utilizando el claim relacional entregado por Supabase `e.claims`.
  - El helper `calculateBusinessDays` debe usarse contemplando las fechas jerarquizadas.
  
- **Método `calculateLeadTimeFromClaims`:**
  - Cambiar el filtro estricto `.filter(c => c.fecha_aviso && c.fecha_finalizacion)` para que incluya todos los siniestros definidos como "cerrados" mediante la evaluación de su texto en `estado_softseguros` y calcule contra la fecha final.

## Efectos Colaterales
Solo afecta a `OperationalEfficiencySection` -> Gauge Chart "Ciclo de Resolución". Las métricas generales de eficiencia no sufrirán impactos en rendimiento.
