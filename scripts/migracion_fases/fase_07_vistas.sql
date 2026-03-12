-- ============================================================================
-- FASE 7: VISTAS DE MONITOREO Y REPORTES
-- ============================================================================
-- Ejecutar después de fase_06
-- Crea vistas para dashboards y alertas
-- Tiempo estimado: < 1 minuto
-- ============================================================================

-- ============================================================================
-- 7.1 Vista: Alertas de seguimientos vencidos o próximos
-- ============================================================================

CREATE OR REPLACE VIEW vw_seguimientos_alertas AS
SELECT 
    c.id_softseguros,
    c.numero_siniestro,
    c.asegurado,
    c.aseguradora,
    c.estado_softseguros,
    c.estado_interno,
    c.fecha_ultimo_seguimiento,
    c.fecha_proximo_seguimiento,
    CASE 
        WHEN c.fecha_proximo_seguimiento < CURRENT_DATE THEN 'VENCIDO'
        WHEN c.fecha_proximo_seguimiento <= CURRENT_DATE + INTERVAL '3 days' THEN 'PROXIMO_3_DIAS'
        WHEN c.fecha_proximo_seguimiento <= CURRENT_DATE + INTERVAL '7 days' THEN 'PROXIMO_7_DIAS'
        ELSE 'OK'
    END AS estado_alerta,
    CURRENT_DATE - c.fecha_ultimo_seguimiento AS dias_desde_ultimo,
    c.fecha_proximo_seguimiento - CURRENT_DATE AS dias_para_vencer,
    c.tecnico_asignado,
    c.prioridad,
    c.monto_reclamo
FROM claims c
WHERE c.fecha_proximo_seguimiento IS NOT NULL
   OR (c.fecha_ultimo_seguimiento IS NOT NULL 
       AND UPPER(c.estado_softseguros) IN (
           'AVISO SINIESTRO', 'RADICACIÓN COMPAÑÍA', 'PRESCRIPCIÓN',
           'RADICACION COMPAÑIA', 'PRESCRIPCION'
       ))
ORDER BY 
    CASE 
        WHEN c.fecha_proximo_seguimiento < CURRENT_DATE THEN 0
        WHEN c.fecha_proximo_seguimiento <= CURRENT_DATE + INTERVAL '3 days' THEN 1
        WHEN c.fecha_proximo_seguimiento <= CURRENT_DATE + INTERVAL '7 days' THEN 2
        ELSE 3
    END,
    c.fecha_proximo_seguimiento;

COMMENT ON VIEW vw_seguimientos_alertas IS 
'Muestra siniestros con seguimientos vencidos o próximos a vencer. 
Estados: VENCIDO, PROXIMO_3_DIAS, PROXIMO_7_DIAS, OK.
Ordenados por prioridad (vencidos primero).';

-- ============================================================================
-- 7.2 Vista: Resumen de extracción y migración
-- ============================================================================

CREATE OR REPLACE VIEW vw_resumen_migracion AS
SELECT 
    'Total Siniestros' as metrica,
    COUNT(*)::TEXT as valor,
    'Registros totales en tabla claims' as descripcion
FROM claims

UNION ALL

SELECT 
    'Con Fecha Último Seguimiento',
    COUNT(*)::TEXT,
    'Registros con fecha extraída de ultimo_seguimiento_raw'
FROM claims 
WHERE fecha_ultimo_seguimiento IS NOT NULL

UNION ALL

SELECT 
    'Con Fecha Próximo Seguimiento',
    COUNT(*)::TEXT,
    'Registros con fecha calculada (etapas 1, 2, 13)'
FROM claims 
WHERE fecha_proximo_seguimiento IS NOT NULL

UNION ALL

SELECT 
    'Seguimientos Vencidos',
    COUNT(*)::TEXT,
    'Fecha próxima ya pasó'
FROM claims 
WHERE fecha_proximo_seguimiento < CURRENT_DATE

UNION ALL

SELECT 
    'Seguimientos Próximos (3 días)',
    COUNT(*)::TEXT,
    'Vencen en los próximos 3 días'
FROM claims 
WHERE fecha_proximo_seguimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'

UNION ALL

SELECT 
    'Registros en siniestro_etapas',
    COUNT(*)::TEXT,
    'Total de registros históricos de etapas'
FROM siniestro_etapas

UNION ALL

SELECT 
    'Etapas Extraídas (Etapa 1)',
    COUNT(*)::TEXT,
    'Registros con fecha de etapa 1 (Aviso)'
FROM siniestro_etapas 
WHERE etapa_1_fecha IS NOT NULL

UNION ALL

SELECT 
    'Etapas Extraídas (Etapa 16)',
    COUNT(*)::TEXT,
    'Registros con fecha de etapa 16 (Pagado)'
FROM siniestro_etapas 
WHERE etapa_16_fecha IS NOT NULL;

COMMENT ON VIEW vw_resumen_migracion IS 
'Resumen ejecutivo del estado de la migración y datos de seguimiento';

-- ============================================================================
-- 7.3 Vista: KPI de etapas y duraciones
-- ============================================================================

CREATE OR REPLACE VIEW vw_kpi_etapas AS
SELECT 
    se.claim_id,
    c.numero_siniestro,
    c.asegurado,
    -- Flags de etapas completadas
    CASE WHEN se.etapa_1_fecha IS NOT NULL THEN 1 ELSE 0 END as tiene_etapa_1,
    CASE WHEN se.etapa_2_fecha IS NOT NULL THEN 1 ELSE 0 END as tiene_etapa_2,
    CASE WHEN se.etapa_3_fecha IS NOT NULL THEN 1 ELSE 0 END as tiene_etapa_3,
    CASE WHEN se.etapa_4_fecha IS NOT NULL THEN 1 ELSE 0 END as tiene_etapa_4,
    CASE WHEN se.etapa_5_fecha IS NOT NULL THEN 1 ELSE 0 END as tiene_etapa_5,
    CASE WHEN se.etapa_6_fecha IS NOT NULL THEN 1 ELSE 0 END as tiene_etapa_6,
    CASE WHEN se.etapa_7_fecha IS NOT NULL THEN 1 ELSE 0 END as tiene_etapa_7,
    CASE WHEN se.etapa_8_fecha IS NOT NULL THEN 1 ELSE 0 END as tiene_etapa_8,
    CASE WHEN se.etapa_9_fecha IS NOT NULL THEN 1 ELSE 0 END as tiene_etapa_9,
    CASE WHEN se.etapa_10_fecha IS NOT NULL THEN 1 ELSE 0 END as tiene_etapa_10,
    CASE WHEN se.etapa_11_fecha IS NOT NULL THEN 1 ELSE 0 END as tiene_etapa_11,
    CASE WHEN se.etapa_12_fecha IS NOT NULL THEN 1 ELSE 0 END as tiene_etapa_12,
    CASE WHEN se.etapa_13_fecha IS NOT NULL THEN 1 ELSE 0 END as tiene_etapa_13,
    CASE WHEN se.etapa_14_fecha IS NOT NULL THEN 1 ELSE 0 END as tiene_etapa_14,
    CASE WHEN se.etapa_15_fecha IS NOT NULL THEN 1 ELSE 0 END as tiene_etapa_15,
    CASE WHEN se.etapa_16_fecha IS NOT NULL THEN 1 ELSE 0 END as tiene_etapa_16,
    -- Duraciones entre etapas (en días)
    se.etapa_2_fecha - se.etapa_1_fecha as duracion_etapa_1_dias,
    se.etapa_3_fecha - se.etapa_2_fecha as duracion_etapa_2_dias,
    se.etapa_4_fecha - se.etapa_3_fecha as duracion_etapa_3_dias,
    se.etapa_5_fecha - se.etapa_4_fecha as duracion_etapa_4_dias,
    se.etapa_6_fecha - se.etapa_5_fecha as duracion_etapa_5_dias,
    se.etapa_7_fecha - se.etapa_6_fecha as duracion_etapa_6_dias,
    -- Lead time total (Aviso a Pagado)
    se.etapa_16_fecha - se.etapa_1_fecha as lead_time_total_dias,
    -- Metadata
    c.aseguradora,
    c.ramo,
    c.estado_softseguros
FROM siniestro_etapas se
LEFT JOIN claims c ON se.claim_id = c.id_softseguros
WHERE se.is_active = TRUE;

COMMENT ON VIEW vw_kpi_etapas IS 
'Datos estructurados para cálculo de KPIs: duración por etapa, lead time, etc.';

-- ============================================================================
-- 7.4 Vista: Siniestros sin seguimiento reciente
-- ============================================================================

CREATE OR REPLACE VIEW vw_sin_seguimiento_reciente AS
SELECT 
    c.id_softseguros,
    c.numero_siniestro,
    c.asegurado,
    c.estado_softseguros,
    c.estado_interno,
    c.fecha_ultimo_seguimiento,
    CURRENT_DATE - c.fecha_ultimo_seguimiento as dias_sin_seguimiento,
    c.tecnico_asignado,
    c.prioridad,
    CASE 
        WHEN CURRENT_DATE - c.fecha_ultimo_seguimiento > 30 THEN 'CRITICO'
        WHEN CURRENT_DATE - c.fecha_ultimo_seguimiento > 15 THEN 'ALERTA'
        WHEN CURRENT_DATE - c.fecha_ultimo_seguimiento > 7 THEN 'ATENCION'
        ELSE 'NORMAL'
    END as nivel_riesgo
FROM claims c
WHERE c.fecha_ultimo_seguimiento IS NOT NULL
  AND c.estado_softseguros NOT IN ('PAGADO', 'FINALIZADO')
  AND CURRENT_DATE - c.fecha_ultimo_seguimiento > 7
ORDER BY dias_sin_seguimiento DESC;

COMMENT ON VIEW vw_sin_seguimiento_reciente IS 
'Siniestros activos sin seguimiento en los últimos 7 días. 
Niveles: CRITICO (>30 días), ALERTA (>15 días), ATENCION (>7 días)';

-- ============================================================================
-- 7.5 Verificar que las vistas fueron creadas
-- ============================================================================

SELECT 
    table_name as vista,
    'Creada exitosamente' as estado
FROM information_schema.views 
WHERE table_schema = 'public'
  AND table_name IN (
    'vw_seguimientos_alertas',
    'vw_resumen_migracion', 
    'vw_kpi_etapas',
    'vw_sin_seguimiento_reciente'
  )
ORDER BY table_name;

-- ============================================================================
-- 7.6 Test rápido de vistas
-- ============================================================================

-- Test 1: Ver resumen
SELECT * FROM vw_resumen_migracion;

-- Test 2: Ver alertas (limitado a 5)
SELECT * FROM vw_seguimientos_alertas LIMIT 5;

-- ============================================================================
-- NOTAS:
-- 
-- ✅ Las vistas están listas para usar en dashboards y reportes
-- ✅ Se actualizan automáticamente cuando cambian los datos subyacentes
-- ✅ No requieren mantenimiento adicional
--
-- 💡 USOS RECOMENDADOS:
--    - vw_seguimientos_alertas: Dashboard de alertas diarias
--    - vw_resumen_migracion: Reporte ejecutivo de estado
--    - vw_kpi_etapas: Análisis de tiempos y duraciones
--    - vw_sin_seguimiento_reciente: Lista de trabajo para técnicos
--
-- 📝 Próximo paso: Ejecutar fase_08_validacion.sql para verificación final
-- ============================================================================
