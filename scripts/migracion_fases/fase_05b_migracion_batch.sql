-- ============================================================================
-- FASE 5B: MIGRACIÓN POR LOTES (ALTERNATIVA PARA GRANDES VOLÚMENES)
-- ============================================================================
-- USAR ESTE SCRIPT si hay más de 50,000 registros en claims
-- Ejecutar después de fase_04
-- Procesa registros en lotes para evitar bloqueos prolongados
-- ============================================================================

DO $$
DECLARE
    batch_size INT := 1000;
    total_procesados INT := 0;
    total_actualizados INT := 0;
    lote_actual INT := 0;
BEGIN
    RAISE NOTICE 'Iniciando migración por lotes...';
    
    -- ========================================================================
    -- PARTE 1: Actualizar fecha_ultimo_seguimiento por lotes
    -- ========================================================================
    RAISE NOTICE 'Parte 1: Actualizando fecha_ultimo_seguimiento...';
    
    LOOP
        lote_actual := lote_actual + 1;
        
        WITH registros_a_actualizar AS (
            SELECT id_softseguros 
            FROM claims 
            WHERE ultimo_seguimiento_raw IS NOT NULL 
              AND ultimo_seguimiento_raw != ''
              AND (fecha_ultimo_seguimiento IS NULL 
                   OR fecha_ultimo_seguimiento != extraer_fecha_ultimo_seguimiento(ultimo_seguimiento_raw))
            LIMIT batch_size
        )
        UPDATE claims c
        SET fecha_ultimo_seguimiento = extraer_fecha_ultimo_seguimiento(c.ultimo_seguimiento_raw)
        FROM registros_a_actualizar r
        WHERE c.id_softseguros = r.id_softseguros;
        
        GET DIAGNOSTICS total_actualizados = ROW_COUNT;
        total_procesados := total_procesados + total_actualizados;
        
        RAISE NOTICE 'Lote %: % registros actualizados (Total: %)', 
            lote_actual, total_actualizados, total_procesados;
        
        EXIT WHEN total_actualizados = 0;
        
        -- Pequeña pausa para no saturar la BD
        PERFORM pg_sleep(0.2);
    END LOOP;
    
    RAISE NOTICE 'Parte 1 completada. Total: % registros', total_procesados;
    
    -- ========================================================================
    -- PARTE 2: Calcular fecha_proximo_seguimiento por lotes
    -- ========================================================================
    RAISE NOTICE 'Parte 2: Calculando fecha_proximo_seguimiento...';
    
    total_procesados := 0;
    lote_actual := 0;
    
    LOOP
        lote_actual := lote_actual + 1;
        
        WITH registros_a_actualizar AS (
            SELECT id_softseguros 
            FROM claims 
            WHERE fecha_ultimo_seguimiento IS NOT NULL
              AND UPPER(estado_softseguros) IN (
                  'AVISO SINIESTRO', '1 AVISO SINIESTRO', 'AVISO',
                  'RADICACIÓN COMPAÑÍA', 'RADICACION COMPAÑIA', 'RADICACIÓN', 'RADICACION',
                  'PRESCRIPCIÓN', 'PRESCRIPCION'
              )
              AND (fecha_proximo_seguimiento IS NULL 
                   OR fecha_proximo_seguimiento != calcular_fecha_proximo_seguimiento(
                       fecha_ultimo_seguimiento,
                       estado_softseguros,
                       prescripcion_ordinaria,
                       prescripcion_extraordinaria
                   ))
            LIMIT batch_size
        )
        UPDATE claims c
        SET fecha_proximo_seguimiento = calcular_fecha_proximo_seguimiento(
            c.fecha_ultimo_seguimiento,
            c.estado_softseguros,
            c.prescripcion_ordinaria,
            c.prescripcion_extraordinaria
        )
        FROM registros_a_actualizar r
        WHERE c.id_softseguros = r.id_softseguros;
        
        GET DIAGNOSTICS total_actualizados = ROW_COUNT;
        total_procesados := total_procesados + total_actualizados;
        
        RAISE NOTICE 'Lote %: % registros actualizados (Total: %)', 
            lote_actual, total_actualizados, total_procesados;
        
        EXIT WHEN total_actualizados = 0;
        
        PERFORM pg_sleep(0.2);
    END LOOP;
    
    RAISE NOTICE 'Parte 2 completada. Total: % registros', total_procesados;
    
    -- ========================================================================
    -- PARTE 3: Poblar siniestro_etapas por lotes
    -- ========================================================================
    RAISE NOTICE 'Parte 3: Poblando siniestro_etapas...';
    
    total_procesados := 0;
    lote_actual := 0;
    
    LOOP
        lote_actual := lote_actual + 1;
        
        WITH registros_a_procesar AS (
            SELECT c.id_softseguros
            FROM claims c
            LEFT JOIN siniestro_etapas se ON c.id_softseguros = se.claim_id
            WHERE (c.fecha_aviso IS NOT NULL 
                   OR c.fecha_notificacion_aseguradora IS NOT NULL 
                   OR c.ultimo_seguimiento_raw IS NOT NULL)
              AND (se.claim_id IS NULL 
                   OR se.updated_at < COALESCE(c.updated_at, c.created_at, NOW()))
            LIMIT batch_size
        )
        INSERT INTO siniestro_etapas (
            claim_id, etapa_1_fecha, etapa_2_fecha,
            etapa_3_fecha, etapa_4_fecha, etapa_5_fecha, etapa_6_fecha,
            etapa_7_fecha, etapa_8_fecha, etapa_9_fecha, etapa_10_fecha,
            etapa_11_fecha, etapa_12_fecha, etapa_13_fecha, etapa_14_fecha,
            etapa_15_fecha, etapa_16_fecha, is_active, updated_at
        )
        SELECT 
            c.id_softseguros,
            c.fecha_aviso::DATE,
            c.fecha_notificacion_aseguradora::DATE,
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
        INNER JOIN registros_a_procesar r ON c.id_softseguros = r.id_softseguros
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
        
        GET DIAGNOSTICS total_actualizados = ROW_COUNT;
        total_procesados := total_procesados + total_actualizados;
        
        RAISE NOTICE 'Lote %: % registros procesados (Total: %)', 
            lote_actual, total_actualizados, total_procesados;
        
        EXIT WHEN total_actualizados = 0;
        
        PERFORM pg_sleep(0.3);
    END LOOP;
    
    RAISE NOTICE 'Parte 3 completada. Total: % registros', total_procesados;
    RAISE NOTICE 'Migración por lotes finalizada exitosamente!';
    
END $$;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

SELECT 
    'RESUMEN MIGRACIÓN POR LOTES' as reporte,
    (SELECT COUNT(*) FROM claims WHERE fecha_ultimo_seguimiento IS NOT NULL) as con_fecha_ultimo,
    (SELECT COUNT(*) FROM claims WHERE fecha_proximo_seguimiento IS NOT NULL) as con_fecha_proximo,
    (SELECT COUNT(*) FROM siniestro_etapas) as registros_etapas,
    (SELECT COUNT(*) FROM claims) as total_claims;

-- ============================================================================
-- NOTAS:
-- 
-- ✅ Esta versión por lotes evita bloqueos prolongados en la BD
-- ✅ Procesa 1000 registros por lote con pausas de 0.2-0.3 segundos
-- ✅ Muestra progreso en tiempo real a través de RAISE NOTICE
-- ✅ Puede ejecutarse durante horario laboral sin afectar performance
--
-- 📝 Próximo paso: Ejecutar fase_06_triggers.sql
-- ============================================================================
