-- ============================================================================
-- FASE 4: FUNCIÓN - CALCULAR FECHA PRÓXIMO SEGUIMIENTO
-- ============================================================================
-- Ejecutar después de fase_03
-- Crea función para calcular fecha de próximo seguimiento
-- Solo calcula para etapas 1, 2 y 13
-- Tiempo estimado: < 30 segundos
-- ============================================================================

CREATE OR REPLACE FUNCTION calcular_fecha_proximo_seguimiento(
    p_fecha_ultimo DATE,
    p_estado_softseguros TEXT,
    p_prescripcion_ord DATE,
    p_prescripcion_ext DATE
)
RETURNS DATE AS $$
DECLARE
    v_fecha_resultado DATE;
    v_estado_upper TEXT;
BEGIN
    -- Validar entrada
    IF p_fecha_ultimo IS NULL THEN
        RETURN NULL;
    END IF;

    v_estado_upper := UPPER(COALESCE(p_estado_softseguros, ''));

    -- Calcular según la etapa
    CASE v_estado_upper
        -- ETAPA 1: AVISO SINIESTRO
        -- Regla: +3 días (Código Comercio Art. 1075)
        WHEN 'AVISO SINIESTRO', '1 AVISO SINIESTRO', 'AVISO' THEN
            v_fecha_resultado := p_fecha_ultimo + INTERVAL '3 days';
            
        -- ETAPA 2: RADICACIÓN COMPAÑÍA
        -- Regla: +1 mes (Código Comercio Art. 1080)
        WHEN 'RADICACIÓN COMPAÑÍA', 'RADICACION COMPAÑIA', 'RADICACIÓN', 'RADICACION' THEN
            v_fecha_resultado := p_fecha_ultimo + INTERVAL '1 month';
            
        -- ETAPA 13: PRESCRIPCIÓN
        -- Regla: Usar la fecha más restrictiva (la que vence primero)
        WHEN 'PRESCRIPCIÓN', 'PRESCRIPCION' THEN
            IF p_prescripcion_ord IS NOT NULL AND p_prescripcion_ext IS NOT NULL THEN
                -- Ambas existen: devolver la más cercana
                v_fecha_resultado := LEAST(p_prescripcion_ord, p_prescripcion_ext);
            ELSIF p_prescripcion_ord IS NOT NULL THEN
                v_fecha_resultado := p_prescripcion_ord;
            ELSIF p_prescripcion_ext IS NOT NULL THEN
                v_fecha_resultado := p_prescripcion_ext;
            ELSE
                v_fecha_resultado := NULL;
            END IF;
            
        -- OTRAS ETAPAS: No calculables automáticamente
        ELSE
            v_fecha_resultado := NULL;
    END CASE;
    
    RETURN v_fecha_resultado;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calcular_fecha_proximo_seguimiento(DATE, TEXT, DATE, DATE) IS 
'Calcula la fecha de próximo seguimiento según etapa.
Etapas calculables:
- Etapa 1 (Aviso): +3 días
- Etapa 2 (Radicación): +1 mes
- Etapa 13 (Prescripción): Usa fecha prescripción más cercana
Otras etapas: Retorna NULL';

-- ============================================================================
-- VERIFICACIÓN: Probar la función con datos de ejemplo
-- ============================================================================

DO $$
DECLARE
    v_test1 DATE;
    v_test2 DATE;
    v_test3 DATE;
BEGIN
    -- Test 1: Etapa 1 - Aviso Siniestro
    v_test1 := calcular_fecha_proximo_seguimiento(
        '2024-01-15'::DATE, 
        'AVISO SINIESTRO', 
        NULL, 
        NULL
    );
    RAISE NOTICE 'Test 1 - Etapa 1 (Aviso): % (esperado: 2024-01-18)', v_test1;
    
    -- Test 2: Etapa 2 - Radicación
    v_test2 := calcular_fecha_proximo_seguimiento(
        '2024-01-15'::DATE, 
        'RADICACIÓN COMPAÑÍA', 
        NULL, 
        NULL
    );
    RAISE NOTICE 'Test 2 - Etapa 2 (Radicación): % (esperado: 2024-02-15)', v_test2;
    
    -- Test 3: Etapa 13 - Prescripción (ambas fechas)
    v_test3 := calcular_fecha_proximo_seguimiento(
        '2024-01-15'::DATE, 
        'PRESCRIPCIÓN', 
        '2026-01-15'::DATE,  -- 2 años (ordinaria)
        '2029-01-15'::DATE   -- 5 años (extraordinaria)
    );
    RAISE NOTICE 'Test 3 - Etapa 13 (Prescripción): % (esperado: 2026-01-15)', v_test3;
END $$;

-- ============================================================================
-- VERIFICACIÓN: Contar registros que se verán afectados por cada etapa
-- ============================================================================

SELECT 
    'Etapa 1 (Aviso)' as tipo,
    COUNT(*) as total_registros,
    COUNT(fecha_aviso) as con_fecha_sistema
FROM claims 
WHERE UPPER(estado_softseguros) IN ('AVISO SINIESTRO', '1 AVISO SINIESTRO', 'AVISO')

UNION ALL

SELECT 
    'Etapa 2 (Radicación)',
    COUNT(*),
    COUNT(fecha_notificacion_aseguradora)
FROM claims 
WHERE UPPER(estado_softseguros) IN ('RADICACIÓN COMPAÑÍA', 'RADICACION COMPAÑIA', 'RADICACIÓN')

UNION ALL

SELECT 
    'Etapa 13 (Prescripción)',
    COUNT(*),
    COUNT(prescripcion_ordinaria) + COUNT(prescripcion_extraordinaria)
FROM claims 
WHERE UPPER(estado_softseguros) IN ('PRESCRIPCIÓN', 'PRESCRIPCION');

-- ============================================================================
-- NOTAS:
-- 
-- ✅ Si los tests retornan valores esperados y hay registros para migrar,
--    estás listo para ejecutar la fase de migración
-- ⚠️  Si no hay registros en ninguna etapa calculable, verificar:
--     - Que estado_softseguros tenga los valores esperados
--     - Que haya datos en fecha_aviso y fecha_notificacion_aseguradora
-- 📝 Próximo paso: Ejecutar fase_05_migracion.sql
-- ============================================================================
