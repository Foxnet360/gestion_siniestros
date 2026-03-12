-- ============================================================================
-- VALIDACIÓN DE KPIs - DATOS DE PRUEBA SGS
-- ============================================================================
-- Ejecutar este script después de generar los datos para verificar
-- que los KPIs cumplen con las métricas objetivo
-- ============================================================================

\echo '========================================'
\echo 'VALIDACIÓN DE KPIs - DATOS DE PRUEBA'
\echo '========================================'
\echo ''

-- ============================================================================
-- 1. LEAD TIME (Tiempo promedio de resolución)
-- Objetivo: ~25 días hábiles
-- ============================================================================

\echo '--- 1. LEAD TIME ---'

WITH lead_times AS (
    SELECT 
        se.claim_id,
        se.etapa_1_fecha,
        se.etapa_16_fecha,
        (se.etapa_16_fecha - se.etapa_1_fecha) as dias_totales,
        -- Calcular días hábiles (excluyendo fines de semana)
        (
            SELECT COUNT(*)::INTEGER
            FROM generate_series(se.etapa_1_fecha, se.etapa_16_fecha, '1 day'::INTERVAL) AS d
            WHERE EXTRACT(DOW FROM d) NOT IN (0, 6)
        ) as dias_habiles
    FROM siniestro_etapas se
    JOIN claims c ON se.claim_id = c.id_softseguros
    WHERE c.id_softseguros LIKE 'TEST-%'
        AND se.etapa_1_fecha IS NOT NULL 
        AND se.etapa_16_fecha IS NOT NULL
)
SELECT 
    'Lead Time Promedio' as kpi,
    ROUND(AVG(dias_habiles), 2) as dias_habiles_promedio,
    ROUND(AVG(dias_totales), 2) as dias_totales_promedio,
    COUNT(*) as total_casos,
    CASE 
        WHEN AVG(dias_habiles) BETWEEN 20 AND 30 THEN '✓ CUMPLE'
        ELSE '✗ NO CUMPLE'
    END as estado
FROM lead_times;

\echo ''

-- ============================================================================
-- 2. ALERTAS SLA (>30 días hábiles)
-- Objetivo: 15% de casos
-- ============================================================================

\echo '--- 2. ALERTAS SLA (>30 días hábiles) ---'

WITH lead_times AS (
    SELECT 
        se.claim_id,
        (
            SELECT COUNT(*)::INTEGER
            FROM generate_series(se.etapa_1_fecha, se.etapa_16_fecha, '1 day'::INTERVAL) AS d
            WHERE EXTRACT(DOW FROM d) NOT IN (0, 6)
        ) as dias_habiles
    FROM siniestro_etapas se
    JOIN claims c ON se.claim_id = c.id_softseguros
    WHERE c.id_softseguros LIKE 'TEST-%'
        AND se.etapa_1_fecha IS NOT NULL 
        AND se.etapa_16_fecha IS NOT NULL
),
totales AS (
    SELECT COUNT(*) as total FROM lead_times
),
alertas AS (
    SELECT COUNT(*) as cantidad 
    FROM lead_times 
    WHERE dias_habiles > 30
)
SELECT 
    'Alertas SLA' as kpi,
    a.cantidad as casos_alerta,
    t.total as total_casos,
    ROUND(a.cantidad * 100.0 / t.total, 2) as porcentaje,
    CASE 
        WHEN ROUND(a.cantidad * 100.0 / t.total, 2) BETWEEN 14 AND 16 THEN '✓ CUMPLE'
        ELSE '✗ NO CUMPLE'
    END as estado
FROM alertas a, totales t;

\echo ''

-- ============================================================================
-- 3. TASA DE DESISTIMIENTO
-- Objetivo: 8%
-- ============================================================================

\echo '--- 3. TASA DE DESISTIMIENTO ---'

WITH totales AS (
    SELECT COUNT(*) as total 
    FROM claims 
    WHERE id_softseguros LIKE 'TEST-%'
),
desistimientos AS (
    SELECT COUNT(*) as cantidad 
    FROM claims 
    WHERE id_softseguros LIKE 'TEST-%'
        AND estado_interno = 'DESISTIMIENTO'
)
SELECT 
    'Tasa Desistimiento' as kpi,
    d.cantidad as casos_desistimiento,
    t.total as total_casos,
    ROUND(d.cantidad * 100.0 / t.total, 2) as porcentaje,
    CASE 
        WHEN ROUND(d.cantidad * 100.0 / t.total, 2) BETWEEN 7 AND 9 THEN '✓ CUMPLE'
        ELSE '✗ NO CUMPLE'
    END as estado
FROM desistimientos d, totales t;

-- Verificación adicional: Desistimientos deben tener etapa 10
\echo 'Verificación: Desistimientos con Etapa 10:'

SELECT 
    'Desistimientos con Etapa 10' as verificacion,
    COUNT(*) as cantidad
FROM claims c
JOIN siniestro_etapas se ON c.id_softseguros = se.claim_id
WHERE c.id_softseguros LIKE 'TEST-%'
    AND c.estado_interno = 'DESISTIMIENTO'
    AND se.etapa_10_fecha IS NOT NULL;

\echo ''

-- ============================================================================
-- 4. TASA DE OBJETADOS
-- Objetivo: 12%
-- ============================================================================

\echo '--- 4. TASA DE OBJETADOS ---'

WITH totales AS (
    SELECT COUNT(*) as total 
    FROM claims 
    WHERE id_softseguros LIKE 'TEST-%'
),
objetados AS (
    SELECT COUNT(DISTINCT c.id_softseguros) as cantidad 
    FROM claims c
    JOIN siniestro_etapas se ON c.id_softseguros = se.claim_id
    WHERE c.id_softseguros LIKE 'TEST-%'
        AND se.etapa_7_fecha IS NOT NULL
)
SELECT 
    'Tasa Objetados' as kpi,
    o.cantidad as casos_objetados,
    t.total as total_casos,
    ROUND(o.cantidad * 100.0 / t.total, 2) as porcentaje,
    CASE 
        WHEN ROUND(o.cantidad * 100.0 / t.total, 2) BETWEEN 11 AND 13 THEN '✓ CUMPLE'
        ELSE '✗ NO CUMPLE'
    END as estado
FROM objetados o, totales t;

\echo ''

-- ============================================================================
-- 5. BACKLOG (Casos activos sin finalizar)
-- Objetivo: 19%
-- ============================================================================

\echo '--- 5. BACKLOG ACTIVO ---'

WITH totales AS (
    SELECT COUNT(*) as total 
    FROM claims 
    WHERE id_softseguros LIKE 'TEST-%'
),
backlog AS (
    SELECT COUNT(*) as cantidad 
    FROM siniestro_etapas se
    JOIN claims c ON se.claim_id = c.id_softseguros
    WHERE c.id_softseguros LIKE 'TEST-%'
        AND se.etapa_15_fecha IS NULL 
        AND se.etapa_16_fecha IS NULL
)
SELECT 
    'Backlog Activo' as kpi,
    b.cantidad as casos_activos,
    t.total as total_casos,
    ROUND(b.cantidad * 100.0 / t.total, 2) as porcentaje,
    CASE 
        WHEN ROUND(b.cantidad * 100.0 / t.total, 2) BETWEEN 18 AND 20 THEN '✓ CUMPLE'
        ELSE '✗ NO CUMPLE'
    END as estado
FROM backlog b, totales t;

-- Distribución del backlog por etapa actual
\echo 'Distribución del Backlog por Etapa Actual:'

WITH active_claims AS (
    SELECT 
        c.id_softseguros,
        CASE 
            WHEN se.etapa_14_fecha IS NOT NULL THEN 14
            WHEN se.etapa_13_fecha IS NOT NULL THEN 13
            WHEN se.etapa_12_fecha IS NOT NULL THEN 12
            WHEN se.etapa_11_fecha IS NOT NULL THEN 11
            WHEN se.etapa_10_fecha IS NOT NULL THEN 10
            WHEN se.etapa_9_fecha IS NOT NULL THEN 9
            WHEN se.etapa_8_fecha IS NOT NULL THEN 8
            WHEN se.etapa_7_fecha IS NOT NULL THEN 7
            WHEN se.etapa_6_fecha IS NOT NULL THEN 6
            WHEN se.etapa_5_fecha IS NOT NULL THEN 5
            WHEN se.etapa_4_fecha IS NOT NULL THEN 4
            WHEN se.etapa_3_fecha IS NOT NULL THEN 3
            WHEN se.etapa_2_fecha IS NOT NULL THEN 2
            WHEN se.etapa_1_fecha IS NOT NULL THEN 1
            ELSE NULL
        END AS etapa_actual
    FROM siniestro_etapas se
    JOIN claims c ON se.claim_id = c.id_softseguros
    WHERE c.id_softseguros LIKE 'TEST-%'
        AND se.etapa_15_fecha IS NULL 
        AND se.etapa_16_fecha IS NULL
)
SELECT 
    etapa_actual,
    COUNT(*) as cantidad,
    CASE etapa_actual
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
    END as nombre_etapa
FROM active_claims
WHERE etapa_actual IS NOT NULL
GROUP BY etapa_actual
ORDER BY etapa_actual;

\echo ''

-- ============================================================================
-- 6. RETENCIÓN POST-SINIESTRO
-- Objetivo: 85% de clientes con pólizas renovadas
-- ============================================================================

\echo '--- 6. RETENCIÓN POST-SINIESTRO ---'

WITH siniestros_finalizados AS (
    SELECT COUNT(*) as total
    FROM claims c
    WHERE c.id_softseguros LIKE 'TEST-%'
        AND c.finalizado = TRUE
        AND c.estado_interno NOT IN ('DESISTIMIENTO', 'OBJECIÓN')
),
-- Simulación: clientes con renovación (basado en lógica de negocio)
renovaciones AS (
    SELECT 
        ROUND(COUNT(*) * 0.85)::INTEGER as cantidad
    FROM claims c
    WHERE c.id_softseguros LIKE 'TEST-%'
        AND c.finalizado = TRUE
        AND c.estado_interno NOT IN ('DESISTIMIENTO', 'OBJECIÓN')
)
SELECT 
    'Retención Post-Siniestro' as kpi,
    r.cantidad as clientes_retenidos,
    sf.total as total_finalizados,
    ROUND(r.cantidad * 100.0 / sf.total, 2) as porcentaje_retencion,
    '✓ SIMULADO' as estado
FROM renovaciones r, siniestros_finalizados sf;

\echo ''

-- ============================================================================
-- 7. DISTRIBUCIÓN POR RAMO
-- ============================================================================

\echo '--- 7. DISTRIBUCIÓN POR RAMO ---'

SELECT 
    ramo,
    COUNT(*) as cantidad,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as porcentaje,
    ROUND(AVG(monto_reclamo), 0) as monto_promedio
FROM claims
WHERE id_softseguros LIKE 'TEST-%'
GROUP BY ramo
ORDER BY cantidad DESC;

\echo ''

-- ============================================================================
-- 8. DISTRIBUCIÓN POR ASEGURADORA
-- ============================================================================

\echo '--- 8. DISTRIBUCIÓN POR ASEGURADORA ---'

SELECT 
    aseguradora,
    COUNT(*) as cantidad,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as porcentaje
FROM claims
WHERE id_softseguros LIKE 'TEST-%'
GROUP BY aseguradora
ORDER BY cantidad DESC;

\echo ''

-- ============================================================================
-- 9. INTEGRIDAD DE DATOS
-- ============================================================================

\echo '--- 9. VERIFICACIÓN DE INTEGRIDAD ---'

-- Verificar que todos los claims tienen etapas
SELECT 
    'Claims sin etapas' as verificacion,
    COUNT(*) as cantidad_anomalías
FROM claims c
LEFT JOIN siniestro_etapas se ON c.id_softseguros = se.claim_id
WHERE c.id_softseguros LIKE 'TEST-%'
    AND se.claim_id IS NULL;

-- Verificar suma de amparos = monto_reclamo
SELECT 
    'Amparos vs Monto Reclamo' as verificacion,
    COUNT(*) as discrepancias
FROM (
    SELECT 
        c.id_softseguros,
        c.monto_reclamo,
        COALESCE(SUM(a.valor), 0) as suma_amparos
    FROM claims c
    LEFT JOIN amparos a ON c.id_softseguros = a.claim_id
    WHERE c.id_softseguros LIKE 'TEST-%'
    GROUP BY c.id_softseguros, c.monto_reclamo
    HAVING COALESCE(SUM(a.valor), 0) != c.monto_reclamo
) discrepancias;

-- Verificar fechas lógicas en etapas
SELECT 
    'Etapas con fechas inválidas' as verificacion,
    COUNT(*) as cantidad_anomalías
FROM siniestro_etapas se
JOIN claims c ON se.claim_id = c.id_softseguros
WHERE c.id_softseguros LIKE 'TEST-%'
    AND (
        (se.etapa_2_fecha IS NOT NULL AND se.etapa_2_fecha < se.etapa_1_fecha)
        OR (se.etapa_3_fecha IS NOT NULL AND se.etapa_3_fecha < se.etapa_2_fecha)
        OR (se.etapa_16_fecha IS NOT NULL AND se.etapa_15_fecha IS NULL)
    );

\echo ''

-- ============================================================================
-- RESUMEN EJECUTIVO
-- ============================================================================

\echo '========================================'
\echo 'RESUMEN EJECUTIVO'
\echo '========================================'

SELECT 
    'Total Claims Generados' as metrica,
    COUNT(*)::TEXT as valor
FROM claims 
WHERE id_softseguros LIKE 'TEST-%'
UNION ALL
SELECT 
    'Total Amparos' as metrica,
    COUNT(*)::TEXT as valor
FROM amparos 
WHERE claim_id LIKE 'TEST-%'
UNION ALL
SELECT 
    'Total Eventos State History' as metrica,
    COUNT(*)::TEXT as valor
FROM state_history 
WHERE claim_id LIKE 'TEST-%'
UNION ALL
SELECT 
    'Total Eventos Timeline' as metrica,
    COUNT(*)::TEXT as valor
FROM timeline 
WHERE claim_id LIKE 'TEST-%';

\echo ''
\echo '========================================'
\echo 'VALIDACIÓN COMPLETADA'
\echo '========================================'
