-- ============================================================================
-- FASE 5: MIGRACIÓN DE DATOS HISTÓRICOS
-- ============================================================================
-- Ejecutar después de fase_04
-- Poblar los datos históricos
-- Tiempo estimado: Variable según volumen (1-30 minutos)
-- IMPORTANTE: Ejecutar en horario de bajo tráfico
-- ============================================================================

-- ============================================================================
-- PASO 5.1: Actualizar fecha_ultimo_seguimiento en claims
-- Extrae la última fecha de ultimo_seguimiento_raw
-- ============================================================================

UPDATE claims
SET fecha_ultimo_seguimiento = extraer_fecha_ultimo_seguimiento(ultimo_seguimiento_raw)
WHERE ultimo_seguimiento_raw IS NOT NULL 
  AND ultimo_seguimiento_raw != ''
  AND (fecha_ultimo_seguimiento IS NULL 
       OR fecha_ultimo_seguimiento != extraer_fecha_ultimo_seguimiento(ultimo_seguimiento_raw));

-- Verificar resultado
SELECT 
    'Paso 5.1 - Fecha último seguimiento' as paso,
    COUNT(*) as registros_actualizados,
    COUNT(fecha_ultimo_seguimiento) as total_con_fecha
FROM claims
WHERE fecha_ultimo_seguimiento IS NOT NULL;

-- ============================================================================
-- PASO 5.2: Calcular fecha_proximo_seguimiento para etapas calculables
-- Solo etapas 1, 2 y 13 calculan fecha próxima automáticamente
-- ============================================================================

UPDATE claims
SET fecha_proximo_seguimiento = calcular_fecha_proximo_seguimiento(
    fecha_ultimo_seguimiento,
    estado_softseguros,
    prescripcion_ordinaria,
    prescripcion_extraordinaria
)
WHERE fecha_ultimo_seguimiento IS NOT NULL
  AND (
      UPPER(estado_softseguros) IN (
          'AVISO SINIESTRO', '1 AVISO SINIESTRO', 'AVISO',
          'RADICACIÓN COMPAÑÍA', 'RADICACION COMPAÑIA', 'RADICACIÓN', 'RADICACION',
          'PRESCRIPCIÓN', 'PRESCRIPCION'
      )
  )
  AND (
      fecha_proximo_seguimiento IS NULL 
      OR fecha_proximo_seguimiento != calcular_fecha_proximo_seguimiento(
          fecha_ultimo_seguimiento,
          estado_softseguros,
          prescripcion_ordinaria,
          prescripcion_extraordinaria
      )
  );

-- Verificar resultado
SELECT 
    'Paso 5.2 - Fecha próximo seguimiento' as paso,
    estado_softseguros,
    COUNT(*) as registros,
    COUNT(fecha_proximo_seguimiento) as con_fecha_calculada,
    AVG(fecha_proximo_seguimiento - fecha_ultimo_seguimiento) as promedio_dias
FROM claims
WHERE fecha_ultimo_seguimiento IS NOT NULL
GROUP BY estado_softseguros
HAVING UPPER(estado_softseguros) IN (
    'AVISO SINIESTRO', '1 AVISO SINIESTRO', 'AVISO',
    'RADICACIÓN COMPAÑÍA', 'RADICACION COMPAÑIA', 'RADICACIÓN', 'RADICACION',
    'PRESCRIPCIÓN', 'PRESCRIPCION'
)
ORDER BY estado_softseguros;

-- ============================================================================
-- PASO 5.3: Poblar/Actualizar tabla siniestro_etapas
-- Estrategia: UPSERT (insertar si no existe, actualizar si existe)
-- ============================================================================

INSERT INTO siniestro_etapas (
    claim_id,
    -- Etapas 1-2: Desde campos del sistema
    etapa_1_fecha,
    etapa_2_fecha,
    -- Etapas 3-16: Extraídas del parsing de texto
    etapa_3_fecha,
    etapa_4_fecha,
    etapa_5_fecha,
    etapa_6_fecha,
    etapa_7_fecha,
    etapa_8_fecha,
    etapa_9_fecha,
    etapa_10_fecha,
    etapa_11_fecha,
    etapa_12_fecha,
    etapa_13_fecha,
    etapa_14_fecha,
    etapa_15_fecha,
    etapa_16_fecha,
    is_active,
    updated_at
)
SELECT 
    c.id_softseguros,
    -- Etapas 1-2 desde campos del sistema
    c.fecha_aviso::DATE,
    c.fecha_notificacion_aseguradora::DATE,
    -- Etapas 3-16 desde parsing de texto
    extraer_fecha_etapa(c.ultimo_seguimiento_raw, 3),
    extraer_fecha_etapa(c.ultimo_seguimiento_raw, 4),
    extraer_fecha_etapa(c.ultimo_seguimiento_raw, 5),
    extraer_fecha_etapa(c.ultimo_seguimiento_raw, 6),
    extraer_fecha_etapa(c.ultimo_seguimiento_raw, 7),
    extraer_fecha_etapa(c.ultimo_seguimiento_raw, 8),
    extraer_fecha_etapa(c.ultimo_seguimiento_raw, 9),
    extraer_fecha_etapa(c.ultimo_seguimiento_raw, 10),
    extraer_fecha_etapa(c.ultimo_seguimiento_raw, 11),
    extraer_fecha_etapa(c.ultimo_seguimiento_raw, 12),
    extraer_fecha_etapa(c.ultimo_seguimiento_raw, 13),
    extraer_fecha_etapa(c.ultimo_seguimiento_raw, 14),
    extraer_fecha_etapa(c.ultimo_seguimiento_raw, 15),
    extraer_fecha_etapa(c.ultimo_seguimiento_raw, 16),
    TRUE,
    NOW()
FROM claims c
LEFT JOIN siniestro_etapas se ON c.id_softseguros = se.claim_id
WHERE 
    -- Solo procesar si hay datos para extraer
    (c.fecha_aviso IS NOT NULL 
     OR c.fecha_notificacion_aseguradora IS NOT NULL 
     OR c.ultimo_seguimiento_raw IS NOT NULL)
    AND (
        -- No existe registro
        se.claim_id IS NULL 
        -- O existe pero está desactualizado
        OR se.updated_at < COALESCE(c.updated_at, c.created_at, NOW())
    )
ON CONFLICT (claim_id) 
DO UPDATE SET
    etapa_1_fecha = EXCLUDED.etapa_1_fecha,
    etapa_2_fecha = EXCLUDED.etapa_2_fecha,
    etapa_3_fecha = EXCLUDED.etapa_3_fecha,
    etapa_4_fecha = EXCLUDED.etapa_4_fecha,
    etapa_5_fecha = EXCLUDED.etapa_5_fecha,
    etapa_6_fecha = EXCLUDED.etapa_6_fecha,
    etapa_7_fecha = EXCLUDED.etapa_7_fecha,
    etapa_8_fecha = EXCLUDED.etapa_8_fecha,
    etapa_9_fecha = EXCLUDED.etapa_9_fecha,
    etapa_10_fecha = EXCLUDED.etapa_10_fecha,
    etapa_11_fecha = EXCLUDED.etapa_11_fecha,
    etapa_12_fecha = EXCLUDED.etapa_12_fecha,
    etapa_13_fecha = EXCLUDED.etapa_13_fecha,
    etapa_14_fecha = EXCLUDED.etapa_14_fecha,
    etapa_15_fecha = EXCLUDED.etapa_15_fecha,
    etapa_16_fecha = EXCLUDED.etapa_16_fecha,
    is_active = TRUE,
    updated_at = NOW();

-- Verificar resultado
SELECT 
    'Paso 5.3 - Tabla siniestro_etapas' as paso,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN etapa_1_fecha IS NOT NULL THEN 1 END) as etapa_1,
    COUNT(CASE WHEN etapa_2_fecha IS NOT NULL THEN 1 END) as etapa_2,
    COUNT(CASE WHEN etapa_3_fecha IS NOT NULL THEN 1 END) as etapa_3,
    COUNT(CASE WHEN etapa_16_fecha IS NOT NULL THEN 1 END) as etapa_16
FROM siniestro_etapas;

-- ============================================================================
-- RESUMEN DE MIGRACIÓN
-- ============================================================================

SELECT 
    'RESUMEN MIGRACIÓN' as reporte,
    (SELECT COUNT(*) FROM claims WHERE fecha_ultimo_seguimiento IS NOT NULL) as con_fecha_ultimo,
    (SELECT COUNT(*) FROM claims WHERE fecha_proximo_seguimiento IS NOT NULL) as con_fecha_proximo,
    (SELECT COUNT(*) FROM siniestro_etapas) as registros_etapas,
    (SELECT COUNT(*) FROM claims) as total_claims;

-- ============================================================================
-- NOTAS:
-- 
-- ✅ Si los conteos muestran datos, la migración fue exitosa
-- ⚠️  Si faltan datos, verificar:
--     - Que ultimo_seguimiento_raw tenga el formato esperado
--     - Que las funciones estén creadas correctamente
--     - Que haya registros en la tabla claims
--
-- 🔄 Si hay muchos registros (> 100,000), considerar ejecutar
--    la migración en lotes más pequeños usando el script batch
--    proporcionado en fase_05b_migracion_batch.sql
--
-- 📝 Próximo paso: Ejecutar fase_06_triggers.sql para activar
--    la actualización automática en tiempo real
-- ============================================================================
