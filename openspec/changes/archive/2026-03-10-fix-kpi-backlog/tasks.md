## 1. Modificación Frontend

## 1. Modificación Frontend

- [x] 1.1 Localizar el componente `SlaDashboard.tsx` en `src/components/Dashboard/SlaDashboard.tsx`
- [x] 1.2 Reemplazar el número estático `1461` por `tasas?.counts?.total` u `overview.totalClaims` dependiendo de lo expuesto por el Hook.
- [x] 1.3 Adicionar fallback en caso de división por cero o valor no numérico `|| 1` en el cálculo de porcentaje.

## 2. Testing y Verificación

- [x] 2.1 Cargar el Dashboard en entorno de desarrollo.
- [x] 2.2 Validar que el porcentaje en el gráfico "CONTROL DE BACKLOG DE SINIESTROS ACTIVOS" coincida matemáticamente con las estadísticas devueltas por el endpoint KPI.
