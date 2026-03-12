# Runbook - Monitoreo del Procesamiento Diario

## Índice

1. [Visión General](#visión-general)
2. [Dashboard de Monitoreo](#dashboard-de-monitoreo)
3. [Alertas y Escalamiento](#alertas-y-escalamiento)
4. [Procedimientos de Troubleshooting](#procedimientos-de-troubleshooting)
5. [Tareas Diarias](#tareas-diarias)
6. [Tareas Semanales](#tareas-semanales)

---

## Visión General

### ¿Qué se monitorea?

El sistema ejecuta procesamiento automático diario a las **2:00 AM** que incluye:

1. **Evaluación de alertas**: Actualiza niveles de alerta en todos los siniestros
2. **Cierre por prescripción**: Cierra siniestros que han prescrito
3. **Estancamiento jurídico**: Detecta y cierra siniestros estancados

### Componentes del Sistema

| Componente                            | Descripción                  | Frecuencia     |
| ------------------------------------- | ---------------------------- | -------------- |
| Edge Function `process-auto-closures` | Procesamiento automático     | Diaria 2:00 AM |
| Cron Job                              | Disparador del proceso       | Diaria 2:00 AM |
| Database                              | Almacenamiento de resultados | Continuo       |
| Reportes JSON                         | Logs de procesamiento        | Por ejecución  |

---

## Dashboard de Monitoreo

### Métricas Clave (KPIs)

#### 1. Éxito del Procesamiento

```sql
-- Verificar última ejecución exitosa
SELECT
    created_at,
    report->>'totalProcessed' as procesados,
    report->>'successCount' as exitosos,
    report->>'errorCount' as errores,
    (report->>'successCount')::int / (report->>'totalProcessed')::int * 100 as porcentaje_exito
FROM processing_reports
WHERE type = 'daily_processing'
ORDER BY created_at DESC
LIMIT 1;
```

**Umbrales:**

- ✅ **Normal**: > 95% éxito
- ⚠️ **Advertencia**: 90-95% éxito
- 🔴 **Crítico**: < 90% éxito

#### 2. Siniestros Procesados

```sql
-- Estadísticas de los últimos 7 días
SELECT
    DATE(created_at) as fecha,
    COUNT(*) as total_siniestros,
    SUM(CASE WHEN report->>'closures.prescription' IS NOT NULL THEN 1 ELSE 0 END) as cerrados_prescripcion,
    SUM(CASE WHEN report->>'closures.legalStagnation' IS NOT NULL THEN 1 ELSE 0 END) as cerrados_estancamiento
FROM processing_reports
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY fecha DESC;
```

#### 3. Errores y Fallos

```sql
-- Errores en las últimas 24 horas
SELECT
    error_message,
    COUNT(*) as frecuencia,
    MAX(created_at) as ultima_ocurrencia
FROM processing_reports,
    jsonb_array_elements(report->'errors') as error_message
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY error_message
ORDER BY frecuencia DESC;
```

---

## Alertas y Escalamiento

### Alerta 1: Procesamiento Fallido

**Condición**: Edge Function no se ejecuta o retorna error

**Detección**:

```sql
-- Verificar si hay reporte de hoy
SELECT COUNT(*)
FROM processing_reports
WHERE DATE(created_at) = CURRENT_DATE;
-- Si es 0, el proceso no corrió
```

**Notificación**:

- Slack: #alerts-critical
- Email: on-call@seguros.com
- PagerDuty: Escalar después de 15 min

**Acción Inmediata**:

1. Verificar logs de Edge Function
2. Ejecutar manualmente si es necesario
3. Investigar causa raíz

### Alerta 2: Tasa de Error Alta

**Condición**: > 10% de siniestros con error

**Detección**:

```sql
SELECT
    (report->>'errorCount')::int / (report->>'totalProcessed')::int as error_rate
FROM processing_reports
WHERE DATE(created_at) = CURRENT_DATE;
```

**Notificación**:

- Slack: #alerts-warning
- Email: dev-team@seguros.com

**Acción**:

1. Revisar reporte JSON detallado
2. Identificar patrón en errores
3. Corregir y re-ejecutar

### Alerta 3: Tiempo de Ejecución Excesivo

**Condición**: Procesamiento toma > 30 minutos

**Notificación**:

- Slack: #alerts-warning

**Acción**:

1. Revisar carga de base de datos
2. Verificar queries lentas
3. Considerar optimización

---

## Procedimientos de Troubleshooting

### Problema: Edge Function No Ejecuta

**Síntomas**:

- No hay reporte del día
- Logs de Supabase vacíos

**Pasos**:

1. **Verificar Cron Job**

```sql
SELECT * FROM cron.job WHERE jobname = 'process-auto-closures-daily';
-- Verificar que existe y está activo
```

2. **Verificar Logs de Función**

```bash
supabase functions logs process-auto-closures --tail
```

3. **Ejecutar Manualmente**

```bash
curl -X POST \
  https://[PROJECT_REF].supabase.co/functions/v1/process-auto-closures \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]"
```

4. **Verificar Permisos**

```sql
-- Verificar que la función tiene permisos correctos
SELECT has_function_privilege('authenticated', 'is_feature_enabled(text, uuid)', 'EXECUTE');
```

### Problema: Muchos Errores en Procesamiento

**Síntomas**:

- Error rate > 10%
- Errores similares en múltiples siniestros

**Pasos**:

1. **Obtener Reporte Detallado**

```sql
SELECT report
FROM processing_reports
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC
LIMIT 1;
```

2. **Analizar Errores**

```sql
-- Listar errores únicos
SELECT DISTINCT
    error->>'message' as error_message,
    error->>'claimId' as claim_id
FROM processing_reports,
    jsonb_array_elements(report->'errors') as error
WHERE DATE(created_at) = CURRENT_DATE;
```

3. **Verificar Datos Problemáticos**

```sql
-- Buscar siniestros con datos faltantes
SELECT id_softseguros, estado_interno, fecha_ocurrencia
FROM claims
WHERE fecha_ocurrencia IS NULL
   OR estado_interno IS NULL;
```

### Problema: Siniestros No Se Cierran

**Síntomas**:

- Siniestros prescritos no aparecen en cierres
- Siniestros estancados no se cierran

**Pasos**:

1. **Verificar Fechas de Prescripción**

```sql
-- Siniestros que deberían estar prescritos
SELECT id_softseguros, numero_siniestro, fecha_prescripcion_ordinaria
FROM claims
WHERE fecha_prescripcion_ordinaria < CURRENT_DATE
  AND estado_interno NOT IN ('FINALIZADO', 'PAGADO');
```

2. **Verificar Umbrales**

```sql
-- Verificar configuración actual
SELECT config_value
FROM app_config
WHERE config_key = 'auto_close_rules';
```

3. **Verificar Exclusiones**

```sql
-- Siniestros excluidos de cierre automático
SELECT id_softseguros, numero_siniestro, prioridad, monto_reclamo
FROM claims
WHERE prioridad = 'ALTA'
   OR monto_reclamo >= 50000000;
```

---

## Tareas Diarias

### 9:00 AM - Revisión Matutina

**Duración**: 5 minutos

**Checklist**:

- [ ] Verificar que el proceso corrió a las 2:00 AM
- [ ] Revisar tasa de éxito (> 95%)
- [ ] Revisar cantidad de cierres (comparar con días anteriores)
- [ ] Verificar que no hay errores críticos

**Comando Rápido**:

```sql
-- Dashboard matutino
SELECT
    'Procesamiento' as metrica,
    CASE
        WHEN (report->>'errorCount')::int / NULLIF((report->>'totalProcessed')::int, 0) < 0.05 THEN '✅ OK'
        WHEN (report->>'errorCount')::int / NULLIF((report->>'totalProcessed')::int, 0) < 0.10 THEN '⚠️ ADVERTENCIA'
        ELSE '🔴 CRÍTICO'
    END as estado
FROM processing_reports
WHERE DATE(created_at) = CURRENT_DATE
UNION ALL
SELECT
    'Cierres Automáticos' as metrica,
    (report->>'closures.total')::text || ' siniestros'
FROM processing_reports
WHERE DATE(created_at) = CURRENT_DATE;
```

### 2:00 PM - Revisión de Errores

**Duración**: 10 minutos

**Acciones**:

1. Revisar errores del día
2. Identificar siniestros problemáticos
3. Crear tickets para correcciones necesarias

### 5:00 PM - Reporte Diario

**Duración**: 5 minutos

**Enviar a**: stakeholders@seguros.com

**Template**:

```
Reporte Diario - Procesamiento Automático
Fecha: [FECHA]

✅ Procesamiento: EXITOSO
- Siniestros procesados: [N]
- Tasa de éxito: [%]
- Cierres automáticos: [N]
- Alertas generadas: [N]

⚠️ Notas:
- [Cualquier incidencia relevante]

Próxima ejecución: Mañana 2:00 AM
```

---

## Tareas Semanales

### Lunes: Revisión Semanal

**Duración**: 30 minutos

**Acciones**:

1. Revisar tendencias de la semana anterior
2. Identificar patrones de errores
3. Verificar performance de queries
4. Actualizar estadísticas de BD si es necesario

**Query**:

```sql
-- Resumen semanal
SELECT
    DATE_TRUNC('week', created_at) as semana,
    SUM((report->>'totalProcessed')::int) as total_procesados,
    SUM((report->>'successCount')::int) as exitosos,
    SUM((report->>'errorCount')::int) as errores,
    AVG((report->>'duration')::int) as tiempo_promedio_ms
FROM processing_reports
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('week', created_at);
```

### Miércoles: Mantenimiento Preventivo

**Duración**: 1 hora

**Acciones**:

1. Revisar logs acumulados
2. Limpiar reportes antiguos (> 30 días)
3. Verificar integridad de datos
4. Revisar performance de índices

**Limpieza**:

```sql
-- Archivar reportes antiguos (opcional)
-- Crear tabla de archivo primero
CREATE TABLE IF NOT EXISTS processing_reports_archive (LIKE processing_reports INCLUDING ALL);

-- Mover reportes antiguos
INSERT INTO processing_reports_archive
SELECT * FROM processing_reports
WHERE created_at < NOW() - INTERVAL '30 days';

-- Eliminar de tabla principal
DELETE FROM processing_reports
WHERE created_at < NOW() - INTERVAL '30 days';
```

### Viernes: Reporte Ejecutivo

**Duración**: 15 minutos

**Enviar a**: management@seguros.com

**Métricas**:

- Total de siniestros procesados
- Siniestros cerrados automáticamente
- Tiempo promedio de procesamiento
- Errores y problemas

---

## Contactos

### Equipo de Soporte

| Rol                 | Nombre           | Contacto            | Horario      |
| ------------------- | ---------------- | ------------------- | ------------ |
| **On-Call Primary** | Rotación semanal | on-call@seguros.com | 24/7         |
| **Tech Lead**       | Juan Pérez       | +1-555-0100         | Lun-Vie 9-18 |
| **DBA**             | María García     | +1-555-0101         | Lun-Vie 9-18 |
| **DevOps**          | Carlos López     | +1-555-0102         | Lun-Vie 9-18 |

### Escalamiento

1. **Nivel 1**: On-call engineer (responde en 15 min)
2. **Nivel 2**: Tech Lead (escalar si no se resuelve en 30 min)
3. **Nivel 3**: Arquitecto/Manager (escalar si afecta producción > 1 hora)

---

## Recursos Adicionales

### Links Útiles

- **Supabase Dashboard**: https://app.supabase.com/project/[PROJECT_ID]
- **Edge Function Logs**: https://app.supabase.com/project/[PROJECT_ID]/functions
- **Database Logs**: https://app.supabase.com/project/[PROJECT_ID]/database/logs
- **Application URL**: https://tu-app.com

### Documentación Relacionada

- [Deployment Guide](./DEPLOYMENT.md)
- [User Guide](./user-guide-technicians.md)
- [Admin Guide](./admin-guide-business-rules.md)

---

**Runbook creado**: Marzo 2026  
**Última actualización**: Marzo 2026  
**Versión**: 1.0  
**Frecuencia de revisión**: Mensual
