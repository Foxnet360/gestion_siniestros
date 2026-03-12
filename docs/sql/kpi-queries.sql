-- ============================================================================
-- KPI CALCULATION QUERIES
-- ============================================================================
-- These queries support the KPI Dashboard and SLA tracking system.
-- All queries are optimized with indexes defined in migration 005.

-- ============================================================================
-- QUERY: Calculate Lead Time Average
-- ============================================================================
-- Description: Calculates the average business days between stage 1 (notice) 
-- and stage 16 (payment) for completed claims.
-- 
-- Business Logic:
-- - Only considers claims with both stage 1 and stage 16 dates
-- - Calculates business days (excludes weekends: Saturday=6, Sunday=0)
-- - Returns average rounded to 2 decimal places
--
-- Performance: Uses index idx_siniestro_etapas_lead_time
-- ============================================================================

/*
SELECT 
    AVG(
        CASE 
            WHEN se.etapa_1_fecha IS NOT NULL AND se.etapa_16_fecha IS NOT NULL
            THEN (
                -- Calculate business days between two dates
                SELECT COUNT(*)::INTEGER
                FROM generate_series(se.etapa_1_fecha, se.etapa_16_fecha, '1 day'::INTERVAL) AS d
                WHERE EXTRACT(DOW FROM d) NOT IN (0, 6)  -- Exclude Sunday (0) and Saturday (6)
            )
            ELSE NULL
        END
    )::NUMERIC(10,2) AS lead_time_avg
FROM siniestro_etapas se
WHERE se.is_active = TRUE
    AND se.etapa_1_fecha IS NOT NULL 
    AND se.etapa_16_fecha IS NOT NULL;
*/

-- ============================================================================
-- QUERY: Calculate Rates (Desistimiento, Objetados, Prescritos)
-- ============================================================================
-- Description: Calculates the percentage of claims that reached specific stages
-- (10=Desistimiento, 7=Objetados, 13=Prescritos) relative to total claims.
--
-- Business Logic:
-- - Counts claims with non-null stage dates
-- - Calculates percentage: (stage_count / total_count) * 100
-- - Returns 0 if no claims exist
--
-- Performance: Uses individual stage indexes (idx_siniestro_etapas_etapa_N)
-- ============================================================================

/*
WITH total_claims AS (
    SELECT COUNT(*)::NUMERIC AS total
    FROM siniestro_etapas
    WHERE is_active = TRUE
),
stage_counts AS (
    SELECT 
        COUNT(CASE WHEN etapa_10_fecha IS NOT NULL THEN 1 END) AS desistimiento_count,
        COUNT(CASE WHEN etapa_7_fecha IS NOT NULL THEN 1 END) AS objetados_count,
        COUNT(CASE WHEN etapa_13_fecha IS NOT NULL THEN 1 END) AS prescritos_count
    FROM siniestro_etapas
    WHERE is_active = TRUE
)
SELECT 
    ROUND((sc.desistimiento_count / NULLIF(tc.total, 0)) * 100, 2) AS tasa_desistimiento,
    ROUND((sc.objetados_count / NULLIF(tc.total, 0)) * 100, 2) AS tasa_objetados,
    ROUND((sc.prescritos_count / NULLIF(tc.total, 0)) * 100, 2) AS tasa_prescritos,
    tc.total AS total_claims
FROM stage_counts sc, total_claims tc;
*/

-- ============================================================================
-- QUERY: Calculate Backlog by Age Groups
-- ============================================================================
-- Description: Groups active claims (without stage 15 or 16) by age ranges
-- based on days since stage 1 (notice date).
--
-- Age Ranges:
-- - 0-30 days: Recent cases
-- - 31-60 days: Moderate cases  
-- - 61-90 days: Cases requiring attention
-- - 90+ days: Critical cases (priority review)
--
-- Business Logic:
-- - Active claims = NO etapa_15_fecha AND NO etapa_16_fecha
-- - Age = CURRENT_DATE - etapa_1_fecha
-- - Groups into predefined ranges for reporting
--
-- Performance: Uses partial index on is_active and stage date columns
-- ============================================================================

/*
WITH active_claims AS (
    SELECT 
        claim_id,
        etapa_1_fecha,
        CURRENT_DATE - etapa_1_fecha AS age_days
    FROM siniestro_etapas
    WHERE is_active = TRUE
        AND etapa_15_fecha IS NULL  -- Not finalized
        AND etapa_16_fecha IS NULL  -- Not paid
        AND etapa_1_fecha IS NOT NULL  -- Has notice date
)
SELECT 
    CASE 
        WHEN age_days <= 30 THEN '0-30 días'
        WHEN age_days <= 60 THEN '31-60 días'
        WHEN age_days <= 90 THEN '61-90 días'
        ELSE '90+ días'
    END AS age_range,
    COUNT(*) AS claim_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS percentage
FROM active_claims
GROUP BY 
    CASE 
        WHEN age_days <= 30 THEN '0-30 días'
        WHEN age_days <= 60 THEN '31-60 días'
        WHEN age_days <= 90 THEN '61-90 días'
        ELSE '90+ días'
    END
ORDER BY 
    MIN(age_days);
*/

-- ============================================================================
-- QUERY: Calculate Backlog by Current Stage
-- ============================================================================
-- Description: Determines the most recent stage reached by each active claim
-- and groups claims by their current stage.
--
-- Stage Detection Logic:
-- - Scans stages 1-14 in reverse order (14 to 1)
-- - First non-null stage = current stage
-- - Only considers claims without stage 15 or 16
--
-- Business Logic:
-- - Helps identify bottlenecks in specific stages
-- - Stage numbers correspond to business process phases
-- - Used for workload distribution analysis
--
-- Performance: Full table scan with conditional logic - consider materialized view
-- ============================================================================

/*
WITH active_claims AS (
    SELECT 
        claim_id,
        -- Determine current stage: highest numbered stage with a date
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
        END AS current_stage
    FROM siniestro_etapas
    WHERE is_active = TRUE
        AND etapa_15_fecha IS NULL
        AND etapa_16_fecha IS NULL
)
SELECT 
    current_stage AS stage_number,
    CASE current_stage
        WHEN 1 THEN 'Aviso Siniestro'
        WHEN 2 THEN 'Radicación'
        WHEN 3 THEN 'Ajustador'
        WHEN 4 THEN 'Documentos Adicionales'
        WHEN 5 THEN 'Asistencia'
        WHEN 6 THEN 'Liquidación'
        WHEN 7 THEN 'Objeción'
        WHEN 8 THEN 'Reconsideración Liquidación'
        WHEN 9 THEN 'Reconsideración Objeción'
        WHEN 10 THEN 'Desistimiento'
        WHEN 11 THEN 'Ratificación Liquidación'
        WHEN 12 THEN 'Ratificación Objeción'
        WHEN 13 THEN 'Prescripción'
        WHEN 14 THEN 'Proceso Jurídico'
        ELSE 'Sin etapa definida'
    END AS stage_name,
    COUNT(*) AS claim_count
FROM active_claims
WHERE current_stage IS NOT NULL
GROUP BY current_stage
ORDER BY current_stage;
*/

-- ============================================================================
-- QUERY: Calculate SLA Compliance Percentage
-- ============================================================================
-- Description: Calculates the percentage of claims closed within the 
-- defined SLA period (target: ≤19%).
--
-- Business Logic:
-- - Closed claims = have etapa_15_fecha OR etapa_16_fecha
-- - Total claims = all active claims (both open and closed)
-- - SLA % = (closed_claims / total_claims) * 100
-- - Note: Lower percentage is BETTER (more open claims being processed)
--
-- Performance: Uses stage 15 and 16 indexes with partial index on is_active
-- ============================================================================

/*
WITH claim_status AS (
    SELECT 
        claim_id,
        CASE 
            WHEN etapa_15_fecha IS NOT NULL OR etapa_16_fecha IS NOT NULL 
            THEN 'closed'
            ELSE 'open'
        END AS status
    FROM siniestro_etapas
    WHERE is_active = TRUE
)
SELECT 
    ROUND(
        COUNT(CASE WHEN status = 'closed' THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) AS sla_compliance_percentage,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) AS closed_claims,
    COUNT(CASE WHEN status = 'open' THEN 1 END) AS open_claims,
    COUNT(*) AS total_claims
FROM claim_status;
*/

-- ============================================================================
-- QUERY: Filtered KPI Query Example
-- ============================================================================
-- Description: Demonstrates how to apply filters to KPI calculations.
-- This example filters by insurer (aseguradora) and date range.
--
-- Filter Parameters:
-- - aseguradora_id: Filter by specific insurer
-- - fecha_desde: Start date for claim notice
-- - fecha_hasta: End date for claim notice
--
-- Join Strategy:
-- - Joins siniestro_etapas with claims table
-- - Applies filters on claims table fields
-- - Calculates KPIs on filtered subset
--
-- Performance: Uses idx_siniestro_etapas_claim_id for efficient join
-- ============================================================================

/*
WITH filtered_claims AS (
    SELECT 
        se.*,
        c.fecha_siniestro,
        c.aseguradora_id,
        c.ramo_id,
        c.vendedor_id
    FROM siniestro_etapas se
    INNER JOIN claims c ON se.claim_id = c.id_softseguros
    WHERE se.is_active = TRUE
        AND c.aseguradora_id = 'INSURER_UUID_HERE'  -- Filter parameter
        AND c.fecha_siniestro BETWEEN '2024-01-01' AND '2024-12-31'  -- Date range
)
SELECT 
    AVG(
        CASE 
            WHEN etapa_1_fecha IS NOT NULL AND etapa_16_fecha IS NOT NULL
            THEN (
                SELECT COUNT(*)::INTEGER
                FROM generate_series(etapa_1_fecha, etapa_16_fecha, '1 day'::INTERVAL) AS d
                WHERE EXTRACT(DOW FROM d) NOT IN (0, 6)
            )
        END
    )::NUMERIC(10,2) AS lead_time_avg,
    COUNT(CASE WHEN etapa_10_fecha IS NOT NULL THEN 1 END) AS desistimiento_count,
    COUNT(CASE WHEN etapa_7_fecha IS NOT NULL THEN 1 END) AS objetados_count,
    COUNT(CASE WHEN etapa_13_fecha IS NOT NULL THEN 1 END) AS prescritos_count,
    COUNT(*) AS total_claims
FROM filtered_claims;
*/

-- ============================================================================
-- QUERY: Extraction Coverage Report
-- ============================================================================
-- Description: Generates a report showing data coverage by stage.
-- Useful for monitoring the effectiveness of the extraction process.
--
-- Coverage Calculation:
-- - For each stage, counts how many claims have a date
-- - Calculates percentage of total claims
-- - Helps identify stages with poor data quality
--
-- Usage: Run weekly to monitor extraction quality
-- ============================================================================

/*
WITH total_claims AS (
    SELECT COUNT(*) AS total
    FROM siniestro_etapas
    WHERE is_active = TRUE
),
coverage AS (
    SELECT 
        'Stage 1 (Aviso)' AS stage_name,
        COUNT(CASE WHEN etapa_1_fecha IS NOT NULL THEN 1 END) AS with_data
    FROM siniestro_etapas WHERE is_active = TRUE
    UNION ALL
    SELECT 'Stage 2 (Radicación)', COUNT(CASE WHEN etapa_2_fecha IS NOT NULL THEN 1 END)
    FROM siniestro_etapas WHERE is_active = TRUE
    UNION ALL
    SELECT 'Stage 3 (Ajustador)', COUNT(CASE WHEN etapa_3_fecha IS NOT NULL THEN 1 END)
    FROM siniestro_etapas WHERE is_active = TRUE
    UNION ALL
    SELECT 'Stage 6 (Liquidación)', COUNT(CASE WHEN etapa_6_fecha IS NOT NULL THEN 1 END)
    FROM siniestro_etapas WHERE is_active = TRUE
    UNION ALL
    SELECT 'Stage 10 (Desistimiento)', COUNT(CASE WHEN etapa_10_fecha IS NOT NULL THEN 1 END)
    FROM siniestro_etapas WHERE is_active = TRUE
    UNION ALL
    SELECT 'Stage 15 (Finalizado)', COUNT(CASE WHEN etapa_15_fecha IS NOT NULL THEN 1 END)
    FROM siniestro_etapas WHERE is_active = TRUE
    UNION ALL
    SELECT 'Stage 16 (Pagado)', COUNT(CASE WHEN etapa_16_fecha IS NOT NULL THEN 1 END)
    FROM siniestro_etapas WHERE is_active = TRUE
)
SELECT 
    c.stage_name,
    c.with_data AS claims_with_date,
    tc.total AS total_claims,
    ROUND(c.with_data * 100.0 / tc.total, 1) AS coverage_percentage
FROM coverage c, total_claims tc
ORDER BY c.stage_name;
*/

-- ============================================================================
-- NOTES FOR DEVELOPERS
-- ============================================================================
-- 
-- 1. INDEX USAGE:
--    All queries above are optimized to use the indexes defined in migration 005.
--    If you modify these queries, ensure they still use indexes effectively.
--
-- 2. DATE CALCULATIONS:
--    Business days exclude weekends (Saturday and Sunday).
--    Colombian holidays are NOT currently excluded - future enhancement.
--
-- 3. ACTIVE CLAIMS:
--    is_active = TRUE filters out soft-deleted records.
--    Always include this filter for accurate results.
--
-- 4. NULL HANDLING:
--    NULL stage dates mean either:
--    a) Stage not yet reached (normal for active claims)
--    b) Stage date not extracted from observations (data quality issue)
--
-- 5. PERFORMANCE MONITORING:
--    Use EXPLAIN ANALYZE before deploying new queries to production.
--    Consider materialized views for complex aggregations run frequently.
--
-- ============================================================================
