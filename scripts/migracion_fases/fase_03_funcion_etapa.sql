-- ============================================================================
-- FASE 3: FUNCIÓN - EXTRAER FECHA DE ETAPA ESPECÍFICA
-- ============================================================================
-- Ejecutar después de fase_02
-- Crea función para extraer fechas de etapas 3-16 por keywords
-- Tiempo estimado: < 30 segundos
-- ============================================================================

CREATE OR REPLACE FUNCTION extraer_fecha_etapa(p_texto TEXT, p_etapa_num INT)
RETURNS DATE AS $$
DECLARE
    v_keywords TEXT[];
    v_fecha DATE;
BEGIN
    -- Definir keywords según la etapa (documentación "N Días X Etapa")
    v_keywords := CASE p_etapa_num
        WHEN 3 THEN ARRAY['AJUSTADOR']
        WHEN 4 THEN ARRAY['DOCUMENTOS ADICIONALES']
        WHEN 5 THEN ARRAY['ASISTENCIA']
        WHEN 6 THEN ARRAY['LIQUIDACIÓN', 'LIQUIDACION']
        WHEN 7 THEN ARRAY['OBJECIÓN', 'OBJECION']
        WHEN 8 THEN ARRAY['RECONSIDERACIÓN LIQUIDACIÓN', 'RECONSIDERACION LIQUIDACION']
        WHEN 9 THEN ARRAY['RECONSIDERACIÓN OBJECIÓN', 'RECONSIDERACION OBJECION']
        WHEN 10 THEN ARRAY['DESISTIMIENTO']
        WHEN 11 THEN ARRAY['RATIFICACIÓN LIQUIDACIÓN', 'RATIFICACION LIQUIDACION']
        WHEN 12 THEN ARRAY['RATIFICACIÓN OBJECIÓN', 'RATIFICACION OBJECION']
        WHEN 13 THEN ARRAY['PRESCRIPCIÓN', 'PRESCRIPCION']
        WHEN 14 THEN ARRAY['PROCESO JURÍDICO', 'PROCESO JURIDICO']
        WHEN 15 THEN ARRAY['FINALIZADO']
        WHEN 16 THEN ARRAY['PAGADO']
        ELSE ARRAY[]::TEXT[]
    END CASE;
    
    -- Si no hay keywords, retornar null
    IF array_length(v_keywords, 1) IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Buscar la última fecha asociada a alguno de los keywords
    SELECT MAX(fecha_encontrada.fecha) INTO v_fecha
    FROM (
        SELECT extraer_fecha_ultimo_seguimiento(
            substring(
                p_texto 
                FROM GREATEST(1, POSITION(UPPER(keyword) IN UPPER(p_texto)) - 200)
                FOR LEAST(LENGTH(p_texto), POSITION(UPPER(keyword) IN UPPER(p_texto)) + 100)
            )
        ) AS fecha
        FROM UNNEST(v_keywords) AS keyword
        WHERE UPPER(p_texto) LIKE '%' || UPPER(keyword) || '%'
    ) AS fecha_encontrada
    WHERE fecha_encontrada.fecha IS NOT NULL;
    
    RETURN v_fecha;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION extraer_fecha_etapa(TEXT, INT) IS 
'Extrae la fecha de una etapa específica (3-16) del texto de observaciones.
Busca keywords definidos y retorna la fecha más reciente asociada.
Ejemplo: extraer_fecha_etapa(texto, 7) busca "OBJECIÓN" y retorna la fecha';

-- ============================================================================
-- VERIFICACIÓN: Probar la función con datos reales de la BD
-- ============================================================================

-- Verificar cuántos registros tienen cada etapa detectable
SELECT 
    'Etapa 3 (Ajustador)' as etapa,
    COUNT(*) FILTER (WHERE extraer_fecha_etapa(ultimo_seguimiento_raw, 3) IS NOT NULL) as encontrados
FROM claims 
WHERE ultimo_seguimiento_raw IS NOT NULL

UNION ALL

SELECT 
    'Etapa 7 (Objeción)',
    COUNT(*) FILTER (WHERE extraer_fecha_etapa(ultimo_seguimiento_raw, 7) IS NOT NULL)
FROM claims 
WHERE ultimo_seguimiento_raw IS NOT NULL

UNION ALL

SELECT 
    'Etapa 10 (Desistimiento)',
    COUNT(*) FILTER (WHERE extraer_fecha_etapa(ultimo_seguimiento_raw, 10) IS NOT NULL)
FROM claims 
WHERE ultimo_seguimiento_raw IS NOT NULL

UNION ALL

SELECT 
    'Etapa 16 (Pagado)',
    COUNT(*) FILTER (WHERE extraer_fecha_etapa(ultimo_seguimiento_raw, 16) IS NOT NULL)
FROM claims 
WHERE ultimo_seguimiento_raw IS NOT NULL;

-- ============================================================================
-- NOTAS:
-- 
-- ✅ Si los conteos son > 0, la función está detectando etapas correctamente
-- ⚠️  Si todos son 0, verificar:
--     - Que ultimo_seguimiento_raw tenga datos
--     - Que los keywords coincidan con el texto real
-- 📝 Próximo paso: Ejecutar fase_04_funcion_calculo.sql
-- ============================================================================
