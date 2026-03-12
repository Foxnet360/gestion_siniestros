-- ============================================================
-- MIGRACIÓN: Optimización de KPIs - Fase 1
-- Fecha: 2026-03-05
-- Proyecto: SGS - Gestión de Siniestros
-- ============================================================

-- ============================================================
-- 1. FUNCIÓN: get_kpi_overview_v2
-- Calcula todos los KPIs del overview en una sola query SQL
-- ============================================================

CREATE OR REPLACE FUNCTION get_kpi_overview_v2(
    p_fecha_desde DATE DEFAULT NULL,
    p_fecha_hasta DATE DEFAULT NULL,
    p_aseguradora UUID DEFAULT NULL,
    p_ramo UUID DEFAULT NULL,
    p_vendedor UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'leadTimeAvg', COALESCE(ROUND(avg_lead_time::numeric, 2), 0),
        'tasaDesistimiento', COALESCE(ROUND(desistimiento_pct, 2), 0),
        'tasaObjetados', COALESCE(ROUND(objetados_pct, 2), 0),
        'tasaPrescritos', COALESCE(ROUND(prescritos_pct, 2), 0),
        'porcentajeCerradosPlazo', COALESCE(ROUND(cerrados_pct, 2), 0),
        'backlogActivos', COALESCE(activos_count, 0),
        'totalClaims', COALESCE(total_count, 0)
    ) INTO result
    FROM (
        SELECT 
            AVG(
                CASE 
                    WHEN se.etapa_1_fecha IS NOT NULL AND se.etapa_16_fecha IS NOT NULL
                    THEN (
                        SELECT COUNT(*)::INTEGER
                        FROM generate_series(se.etapa_1_fecha, se.etapa_16_fecha, '1 day'::INTERVAL) AS d
                        WHERE EXTRACT(DOW FROM d) NOT IN (0, 6)
                    )
                END
            ) as avg_lead_time,
            COUNT(CASE WHEN se.etapa_10_fecha IS NOT NULL THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as desistimiento_pct,
            COUNT(CASE WHEN se.etapa_7_fecha IS NOT NULL THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as objetados_pct,
            COUNT(CASE WHEN se.etapa_13_fecha IS NOT NULL THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as prescritos_pct,
            COUNT(CASE WHEN se.etapa_15_fecha IS NOT NULL OR se.etapa_16_fecha IS NOT NULL THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as cerrados_pct,
            COUNT(CASE WHEN se.etapa_15_fecha IS NULL AND se.etapa_16_fecha IS NULL THEN 1 END) as activos_count,
            COUNT(*) as total_count
        FROM siniestro_etapas se
        INNER JOIN claims c ON se.claim_id = c.id_softseguros
        WHERE se.is_active = TRUE
            AND (p_fecha_desde IS NULL OR c.fecha_siniestro >= p_fecha_desde)
            AND (p_fecha_hasta IS NULL OR c.fecha_siniestro <= p_fecha_hasta)
            AND (p_aseguradora IS NULL OR c.aseguradora_id = p_aseguradora)
            AND (p_ramo IS NULL OR c.ramo_id = p_ramo)
            AND (p_vendedor IS NULL OR c.vendedor_id = p_vendedor)
    ) stats;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- 2. FUNCIÓN: get_kpi_lead_time_v2
-- Calcula lead time con percentiles opcionales
-- ============================================================

CREATE OR REPLACE FUNCTION get_kpi_lead_time_v2(
    p_fecha_desde DATE DEFAULT NULL,
    p_fecha_hasta DATE DEFAULT NULL,
    p_aseguradora UUID DEFAULT NULL,
    p_ramo UUID DEFAULT NULL,
    p_vendedor UUID DEFAULT NULL,
    p_include_percentiles BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    lead_times INTEGER[];
    avg_lt NUMERIC;
    p50_val INTEGER;
    p75_val INTEGER;
    p90_val INTEGER;
    p95_val INTEGER;
BEGIN
    -- Obtener todos los lead times
    SELECT ARRAY_AGG(business_days ORDER BY business_days)
    INTO lead_times
    FROM (
        SELECT 
            CASE 
                WHEN se.etapa_1_fecha IS NOT NULL AND se.etapa_16_fecha IS NOT NULL
                THEN (
                    SELECT COUNT(*)::INTEGER
                    FROM generate_series(se.etapa_1_fecha, se.etapa_16_fecha, '1 day'::INTERVAL) AS d
                    WHERE EXTRACT(DOW FROM d) NOT IN (0, 6)
                )
            END as business_days
        FROM siniestro_etapas se
        INNER JOIN claims c ON se.claim_id = c.id_softseguros
        WHERE se.is_active = TRUE
            AND se.etapa_1_fecha IS NOT NULL 
            AND se.etapa_16_fecha IS NOT NULL
            AND (p_fecha_desde IS NULL OR c.fecha_siniestro >= p_fecha_desde)
            AND (p_fecha_hasta IS NULL OR c.fecha_siniestro <= p_fecha_hasta)
            AND (p_aseguradora IS NULL OR c.aseguradora_id = p_aseguradora)
            AND (p_ramo IS NULL OR c.ramo_id = p_ramo)
            AND (p_vendedor IS NULL OR c.vendedor_id = p_vendedor)
    ) subq
    WHERE business_days IS NOT NULL;

    -- Calcular promedio
    SELECT AVG(val)::NUMERIC INTO avg_lt
    FROM UNNEST(lead_times) as val;

    -- Construir resultado base
    result := jsonb_build_object('average', COALESCE(ROUND(avg_lt, 2), 0));

    -- Calcular percentiles si se solicita
    IF p_include_percentiles AND lead_times IS NOT NULL AND array_length(lead_times, 1) > 0 THEN
        SELECT 
            lead_times[CEIL(array_length(lead_times, 1) * 0.5)::INT],
            lead_times[CEIL(array_length(lead_times, 1) * 0.75)::INT],
            lead_times[CEIL(array_length(lead_times, 1) * 0.90)::INT],
            lead_times[CEIL(array_length(lead_times, 1) * 0.95)::INT]
        INTO p50_val, p75_val, p90_val, p95_val;

        result := result || jsonb_build_object('percentiles', jsonb_build_object(
            'p50', COALESCE(p50_val, 0),
            'p75', COALESCE(p75_val, 0),
            'p90', COALESCE(p90_val, 0),
            'p95', COALESCE(p95_val, 0)
        ));
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- 3. FUNCIÓN: get_kpi_backlog_v2
-- Calcula backlog con agrupación opcional
-- ============================================================

CREATE OR REPLACE FUNCTION get_kpi_backlog_v2(
    p_fecha_desde DATE DEFAULT NULL,
    p_fecha_hasta DATE DEFAULT NULL,
    p_aseguradora UUID DEFAULT NULL,
    p_ramo UUID DEFAULT NULL,
    p_vendedor UUID DEFAULT NULL,
    p_group_by_age BOOLEAN DEFAULT FALSE,
    p_group_by_stage BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    total_count INTEGER;
    age_groups JSONB;
    stage_groups JSONB;
BEGIN
    -- Contar total activos
    SELECT COUNT(*)::INTEGER INTO total_count
    FROM siniestro_etapas se
    INNER JOIN claims c ON se.claim_id = c.id_softseguros
    WHERE se.is_active = TRUE
        AND se.etapa_15_fecha IS NULL 
        AND se.etapa_16_fecha IS NULL
        AND (p_fecha_desde IS NULL OR c.fecha_siniestro >= p_fecha_desde)
        AND (p_fecha_hasta IS NULL OR c.fecha_siniestro <= p_fecha_hasta)
        AND (p_aseguradora IS NULL OR c.aseguradora_id = p_aseguradora)
        AND (p_ramo IS NULL OR c.ramo_id = p_ramo)
        AND (p_vendedor IS NULL OR c.vendedor_id = p_vendedor);

    result := jsonb_build_object('total', COALESCE(total_count, 0));

    -- Agrupar por antigüedad
    IF p_group_by_age THEN
        SELECT jsonb_agg(jsonb_build_object('range', range_name, 'count', cnt) ORDER BY ord)
        INTO age_groups
        FROM (
            SELECT 
                CASE 
                    WHEN age_days <= 30 THEN '0-30 días'
                    WHEN age_days <= 60 THEN '31-60 días'
                    WHEN age_days <= 90 THEN '61-90 días'
                    ELSE '90+ días'
                END as range_name,
                CASE 
                    WHEN age_days <= 30 THEN 1
                    WHEN age_days <= 60 THEN 2
                    WHEN age_days <= 90 THEN 3
                    ELSE 4
                END as ord,
                COUNT(*)::INTEGER as cnt
            FROM (
                SELECT CURRENT_DATE - se.etapa_1_fecha as age_days
                FROM siniestro_etapas se
                INNER JOIN claims c ON se.claim_id = c.id_softseguros
                WHERE se.is_active = TRUE
                    AND se.etapa_15_fecha IS NULL 
                    AND se.etapa_16_fecha IS NULL
                    AND se.etapa_1_fecha IS NOT NULL
                    AND (p_fecha_desde IS NULL OR c.fecha_siniestro >= p_fecha_desde)
                    AND (p_fecha_hasta IS NULL OR c.fecha_siniestro <= p_fecha_hasta)
                    AND (p_aseguradora IS NULL OR c.aseguradora_id = p_aseguradora)
                    AND (p_ramo IS NULL OR c.ramo_id = p_ramo)
                    AND (p_vendedor IS NULL OR c.vendedor_id = p_vendedor)
            ) sub
            GROUP BY 
                CASE 
                    WHEN age_days <= 30 THEN '0-30 días'
                    WHEN age_days <= 60 THEN '31-60 días'
                    WHEN age_days <= 90 THEN '61-90 días'
                    ELSE '90+ días'
                END,
                CASE 
                    WHEN age_days <= 30 THEN 1
                    WHEN age_days <= 60 THEN 2
                    WHEN age_days <= 90 THEN 3
                    ELSE 4
                END
        ) grouped;

        result := result || jsonb_build_object('byAge', COALESCE(age_groups, '[]'::jsonb));
    END IF;

    -- Agrupar por etapa
    IF p_group_by_stage THEN
        SELECT jsonb_agg(jsonb_build_object('stage', stage_num, 'count', cnt) ORDER BY stage_num)
        INTO stage_groups
        FROM (
            SELECT 
                CASE 
                    WHEN etapa_14_fecha IS NOT NULL THEN 14
                    WHEN etapa_13_fecha IS NOT NULL THEN 13
                    WHEN etapa_12_fecha IS NOT NULL THEN 12
                    WHEN etapa_11_fecha IS NOT NULL THEN 11
                    WHEN etapa_10_fecha IS NOT NULL THEN 10
                    WHEN etapa_9_fecha IS NOT NULL THEN 9
                    WHEN etapa_8_fecha IS NOT NULL THEN 8
                    WHEN etapa_7_fecha IS NOT NULL THEN 7
                    WHEN etapa_6_fecha IS NOT NULL THEN 6
                    WHEN etapa_5_fecha IS NOT NULL THEN 5
                    WHEN etapa_4_fecha IS NOT NULL THEN 4
                    WHEN etapa_3_fecha IS NOT NULL THEN 3
                    WHEN etapa_2_fecha IS NOT NULL THEN 2
                    WHEN etapa_1_fecha IS NOT NULL THEN 1
                    ELSE NULL
                END as stage_num,
                COUNT(*)::INTEGER as cnt
            FROM siniestro_etapas se
            INNER JOIN claims c ON se.claim_id = c.id_softseguros
            WHERE se.is_active = TRUE
                AND se.etapa_15_fecha IS NULL 
                AND se.etapa_16_fecha IS NULL
                AND (p_fecha_desde IS NULL OR c.fecha_siniestro >= p_fecha_desde)
                AND (p_fecha_hasta IS NULL OR c.fecha_siniestro <= p_fecha_hasta)
                AND (p_aseguradora IS NULL OR c.aseguradora_id = p_aseguradora)
                AND (p_ramo IS NULL OR c.ramo_id = p_ramo)
                AND (p_vendedor IS NULL OR c.vendedor_id = p_vendedor)
            GROUP BY 
                CASE 
                    WHEN etapa_14_fecha IS NOT NULL THEN 14
                    WHEN etapa_13_fecha IS NOT NULL THEN 13
                    WHEN etapa_12_fecha IS NOT NULL THEN 12
                    WHEN etapa_11_fecha IS NOT NULL THEN 11
                    WHEN etapa_10_fecha IS NOT NULL THEN 10
                    WHEN etapa_9_fecha IS NOT NULL THEN 9
                    WHEN etapa_8_fecha IS NOT NULL THEN 8
                    WHEN etapa_7_fecha IS NOT NULL THEN 7
                    WHEN etapa_6_fecha IS NOT NULL THEN 6
                    WHEN etapa_5_fecha IS NOT NULL THEN 5
                    WHEN etapa_4_fecha IS NOT NULL THEN 4
                    WHEN etapa_3_fecha IS NOT NULL THEN 3
                    WHEN etapa_2_fecha IS NOT NULL THEN 2
                    WHEN etapa_1_fecha IS NOT NULL THEN 1
                    ELSE NULL
                END
            HAVING CASE 
                    WHEN etapa_14_fecha IS NOT NULL THEN 14
                    WHEN etapa_13_fecha IS NOT NULL THEN 13
                    WHEN etapa_12_fecha IS NOT NULL THEN 12
                    WHEN etapa_11_fecha IS NOT NULL THEN 11
                    WHEN etapa_10_fecha IS NOT NULL THEN 10
                    WHEN etapa_9_fecha IS NOT NULL THEN 9
                    WHEN etapa_8_fecha IS NOT NULL THEN 8
                    WHEN etapa_7_fecha IS NOT NULL THEN 7
                    WHEN etapa_6_fecha IS NOT NULL THEN 6
                    WHEN etapa_5_fecha IS NOT NULL THEN 5
                    WHEN etapa_4_fecha IS NOT NULL THEN 4
                    WHEN etapa_3_fecha IS NOT NULL THEN 3
                    WHEN etapa_2_fecha IS NOT NULL THEN 2
                    WHEN etapa_1_fecha IS NOT NULL THEN 1
                    ELSE NULL
                END IS NOT NULL
        ) grouped;

        result := result || jsonb_build_object('byStage', COALESCE(stage_groups, '[]'::jsonb));
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- 4. ÍNDICES ADICIONALES (opcional, si no existen)
-- ============================================================

-- Índice compuesto para filtros de fecha y dimensiones
CREATE INDEX IF NOT EXISTS idx_claims_kpi_filters 
ON claims(fecha_siniestro, aseguradora_id, ramo_id, vendedor_id) 
WHERE is_active = true;

-- Índice covering para siniestro_etapas
CREATE INDEX IF NOT EXISTS idx_etapas_covering 
ON siniestro_etapas(claim_id, is_active, etapa_1_fecha, etapa_16_fecha) 
WHERE is_active = true;

-- ============================================================
-- 5. TESTS DE VERIFICACIÓN
-- ============================================================

-- Test 1: Overview sin filtros
SELECT 'Test 1: Overview' as test, get_kpi_overview_v2() as result;

-- Test 2: Lead time con percentiles
SELECT 'Test 2: Lead Time + Percentiles' as test, get_kpi_lead_time_v2(
    p_include_percentiles := true
) as result;

-- Test 3: Backlog con agrupación
SELECT 'Test 3: Backlog' as test, get_kpi_backlog_v2(
    p_group_by_age := true,
    p_group_by_stage := true
) as result;

-- Test 4: Overview con filtros de fecha
SELECT 'Test 4: Overview con filtros' as test, get_kpi_overview_v2(
    p_fecha_desde := '2024-01-01',
    p_fecha_hasta := '2024-12-31'
) as result;

-- ============================================================
-- DOCUMENTACIÓN
-- ============================================================

COMMENT ON FUNCTION get_kpi_overview_v2 IS 'Calcula KPIs de overview optimizados para el dashboard';
COMMENT ON FUNCTION get_kpi_lead_time_v2 IS 'Calcula lead time con percentiles opcionales';
COMMENT ON FUNCTION get_kpi_backlog_v2 IS 'Calcula backlog con agrupación por edad y/o etapa';

-- ============================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================
