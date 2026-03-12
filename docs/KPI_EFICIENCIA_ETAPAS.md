# KPI Eficiencia por Etapas

Sistema de métricas granulares para analizar la eficiencia del proceso de siniestros por cada una de las 16 etapas.

## Características

- **Métricas por Etapa**: Tiempo de permanencia, frecuencia de seguimiento, cumplimiento SLA para cada etapa
- **Funnel de Conversión**: Visualización de la conversión entre etapas con identificación de cuellos de botella
- **Segmentación**: Filtros por aseguradora, ramo, técnico, tipo de proceso y rango de fechas
- **Calidad de Datos**: Indicador de siniestros excluidos por datos incompletos
- **Percentil P90**: Métrica principal para representar el 90% de los casos
- **Exportación CSV**: Exportar métricas y datos excluidos

## Arquitectura

### Base de Datos

Nuevas tablas creadas:

- `sla_por_etapa`: Definición de SLAs y frecuencias para 16 etapas
- `metricas_etapas`: Métricas calculadas por etapa
- `seguimientos_procesados`: Tracking de seguimientos
- `kpis_etapas_agregados`: Caché de métricas agregadas
- `feriados_colombia`: Calendario de feriados

### Backend

- **MetricasEtapasService.ts**: Servicio de cálculo de métricas
- **eficienciaEtapasRoutes.ts**: Endpoints API
- **procesar-metricas-historicas.ts**: Script batch para procesamiento histórico

### Frontend

- **DashboardEficienciaEtapas.tsx**: Dashboard principal
- **Hooks**: useEficienciaEtapas, useFiltrosEficiencia
- **Componentes de Visualización**: Funnel, tiempos, cuellos de botella, tablas

## Instalación

### 1. Ejecutar DDL

```bash
# Ejecutar script SQL para crear tablas
psql -d tu_base_de_datos -f scripts/kpi_eficiencia_etapas_ddl.sql
```

### 2. Procesar Datos Históricos

```bash
# Procesar todos los siniestros históricos
npx ts-node scripts/procesar-metricas-historicas.ts

# O en modo test (primeros 100)
npx ts-node scripts/procesar-metricas-historicas.ts --test --limit=100
```

### 3. Agregar Ruta

Agregar al router de la aplicación:

```typescript
import { DashboardEficienciaEtapas } from './components/Dashboard/DashboardEficienciaEtapas';

// En tu router
<Route path="/dashboard/eficiencia-etapas" element={<DashboardEficienciaEtapas />} />
```

## Uso

### Dashboard

Acceder a `/dashboard/eficiencia-etapas` para ver:

- Resumen de métricas (Lead Time promedio, P50, P90)
- Comparación por tipo de proceso (Normal, Prescripción)
- Funnel de conversión entre etapas
- Tiempos por etapa vs SLA
- Cuellos de botella identificados

### Filtros

Disponibles filtros por:

- Tipo de proceso (Normal/Prescripción)
- Aseguradora
- Ramo
- Técnico asignado
- Rango de fechas
- Rango de valor

### Exportación

Botón "Exportar" permite descargar:

- Métricas detalladas por etapa
- Datos de funnel
- Resumen de calidad de datos

## API Endpoints

### GET /api/kpis/eficiencia-etapas

Retorna métricas de eficiencia con filtros opcionales.

**Parámetros:**

- `aseguradora`: ID de aseguradora
- `ramo`: ID de ramo
- `tecnico`: ID de técnico
- `tipoProceso`: normal|prescripcion_ordinaria|prescripcion_extraordinaria
- `fechaDesde`, `fechaHasta`: Rango de fechas
- `segmentacion=true`: Incluir datos de segmentación

### GET /api/kpis/eficiencia-etapas/funnel

Retorna datos del funnel de conversión.

### GET /api/kpis/eficiencia-etapas/calidad-datos

Retorna información de calidad de datos y exclusiones.

## SLAs por Etapa

| Etapa | Nombre                      | SLA (días) | Frecuencia Seguimiento |
| ----- | --------------------------- | ---------- | ---------------------- |
| 1     | Aviso Siniestro             | -          | -                      |
| 2     | Radicación Compañía         | 5          | 5 días                 |
| 3     | Ajustador                   | 10         | 5 días                 |
| 4     | Documentos Adicionales      | 7          | 3 días                 |
| 5     | Asistencia                  | 5          | 3 días                 |
| 6     | Liquidación                 | 10         | 5 días                 |
| 7     | Objeción                    | 15         | 5 días                 |
| 8     | Reconsideración Liquidación | 10         | 5 días                 |
| 9     | Reconsideración Objeción    | 15         | 5 días                 |
| 10    | Desistimiento               | -          | -                      |
| 11    | Ratificación Liquidación    | 5          | 3 días                 |
| 12    | Ratificación Objeción       | 5          | 3 días                 |
| 13    | Prescripción                | 730        | 90 días                |
| 14    | Proceso Jurídico            | -          | 30 días                |
| 15    | Finalizado                  | 3          | 1 día                  |
| 16    | Pagado                      | -          | -                      |

## Tipos de Proceso

- **Normal**: Duración < 365 días, sin etapa de prescripción
- **Prescripción Ordinaria**: 365-1095 días (2 años)
- **Prescripción Extraordinaria**: > 1095 días (5 años)

## Mantenimiento

### Procesamiento Periódico

Para mantener las métricas actualizadas, configurar un job periódico:

```bash
# Ejecutar diariamente para procesar nuevos siniestros
npx ts-node scripts/procesar-metricas-historicas.ts
```

### Caché

Las respuestas API se cachean por 5 minutos. El caché se invalida automáticamente al procesar nuevos datos.

## Solución de Problemas

### Alta tasa de exclusiones (>30%)

Si más del 30% de siniestros son excluidos:

1. Revisar calidad de datos en `siniestro_etapas`
2. Verificar que etapas 1 y 16 estén bien pobladas
3. Considerar limpieza de datos históricos

### Métricas no aparecen

1. Verificar que el script DDL se ejecutó correctamente
2. Revisar logs del procesamiento batch
3. Confirmar que `metricas_etapas` tiene datos

## Tests

Ejecutar tests unitarios:

```bash
npm test -- MetricasEtapasService.test.ts
```

## Contribución

Para agregar nuevas métricas o modificar SLAs:

1. Actualizar `sla_por_etapa` en BD
2. Modificar `MetricasEtapasService.ts`
3. Actualizar componentes de UI
4. Ejecutar reprocesamiento batch

## Changelog

### v1.0.0

- Implementación inicial
- 16 etapas con SLAs definidos
- Dashboard con funnel y métricas
- Exportación a CSV
- Filtros y segmentación
