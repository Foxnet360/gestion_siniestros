# Tasks: Fix % Cerrados en Plazo KPI

## 1. Utilidad Compartida (Date Utils)
- [x] 1.1 Crear archivo `src/utils/dateUtils.ts` (si no existe) o añadirle funciones de fechas.
- [x] 1.2 Mover/crear la función `calculateBusinessDays(startDate: string | Date, endDate: string | Date): number` que excluya fines de semana y use `FERIADOS_COLOMBIA`.
- [x] 1.3 Asegurarse de exportar `FERIADOS_COLOMBIA` desde una constante compartida (ej. `src/constants/reports.ts` o `dateUtils.ts`).
- [x] 1.4 Refactorizar `KpiService.ts` para que importe y use `calculateBusinessDays` de la utilidad en lugar de su propia versión repetida (si aplica).

## 2. Backend (KpiService.ts)
- [x] 2.1 En `calculateOverviewFromEtapas`: Actualizar `porcentajeCerradosPlazo`.
  - Contar `finalizadosCount` (total de reclamaciones válidas cerradas).
  - De las cerradas, contar cuántas tienen `< 45` días hábiles de lead time (usando `calculateBusinessDays(etapa_1_fecha, closeDate)`).
  - Calcular el porcentaje `(cerradasEnPlazo / finalizadosCount) * 100`.
- [x] 2.2 En `calculateOverviewFromClaims` (fallback): Actualizar `porcentajeCerradosPlazo`.
  - Contar cuántas cerradas tienen `<= 45` días hábiles entre `fecha_aviso` y `fecha_finalizacion`.
  - Calcular porcentaje sobre el divisor correcto (`finalizadosCount`).

## 3. Frontend (useKpiOperativos.ts)
- [x] 3.1 Actualizar el bloque donde se definen `cerradosEnPlazo` (aprox. línea 42).
- [x] 3.2 Reemplazar el cálculo basado en la diferencia temporal raw (`cierre.getTime() - aviso.getTime()`) por la función `calculateBusinessDays(aviso, cierre)`.
- [x] 3.3 Confirmar que la importación de `calculateBusinessDays` provenga del archivo de utilidades compartidas.
- [x] 3.4 Verificar en desarrollo local (`npm run dev`) que la tarjeta de "% Cerrados en Plazo" en el Dashboard Gerencial renderiza exitosamente y refleja el nuevo cálculo sin errores de React/TS.

## 4. Verificación
- [x] 4.1 Ejecutar `npx tsc --noEmit` para validar que no haya errores de TypeScript tras refactorizar utilidades.
- [x] 4.2 Probar la recarga del dashboard en el navegador y constatar que el porcentaje es realista y funciona con los filtros de tiempo, asesores y aseguradoras.
