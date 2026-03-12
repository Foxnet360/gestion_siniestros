-- ============================================================================
-- FASE 2: FUNCIÓN - EXTRAER ÚLTIMA FECHA DE SEGUIMIENTO
-- ============================================================================
-- Ejecutar después de fase_01
-- Crea la función base para parsing de fechas
-- Tiempo estimado: < 30 segundos
-- ============================================================================

CREATE OR REPLACE FUNCTION extraer_fecha_ultimo_seguimiento(p_texto TEXT)
RETURNS DATE AS $$
DECLARE
    v_dia INT;
    v_mes INT;
    v_anio INT;
BEGIN
    -- Si el texto es nulo o vacío, retornar nulo
    IF p_texto IS NULL OR TRIM(p_texto) = '' THEN
        RETURN NULL;
    END IF;
    
    -- Extraer todas las fechas del formato [Fecha: DD/MM/YYYY
    -- y quedarse con la más reciente
    WITH fechas_encontradas AS (
        SELECT regexp_matches(p_texto, '\[Fecha:\s*(\d{2})/(\d{2})/(\d{4})', 'gi') AS matches
    ),
    fechas_parseadas AS (
        SELECT 
            CAST(matches[1] AS INT) AS dia,
            CAST(matches[2] AS INT) AS mes, 
            CAST(matches[3] AS INT) AS anio
        FROM fechas_encontradas
        WHERE matches IS NOT NULL
          AND CAST(matches[2] AS INT) BETWEEN 1 AND 12
          AND CAST(matches[1] AS INT) BETWEEN 1 AND 31
          AND CAST(matches[3] AS INT) BETWEEN 2020 AND 2100
    )
    SELECT dia, mes, anio INTO v_dia, v_mes, v_anio
    FROM fechas_parseadas
    ORDER BY anio DESC, mes DESC, dia DESC
    LIMIT 1;
    
    IF v_anio IS NOT NULL THEN
        RETURN make_date(v_anio, v_mes, v_dia);
    END IF;
    
    RETURN NULL;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION extraer_fecha_ultimo_seguimiento(TEXT) IS 
'Extrae la fecha más reciente del campo ultimo_seguimiento_raw. 
Formato esperado: [Fecha: DD/MM/YYYY
Ejemplo: [Fecha: 23/12/2024 extrae 2024-12-23';

-- ============================================================================
-- VERIFICACIÓN: Probar la función con datos de ejemplo
-- ============================================================================

DO $$
DECLARE
    v_test1 DATE;
    v_test2 DATE;
    v_test3 DATE;
BEGIN
    -- Test 1: Texto con una fecha
    v_test1 := extraer_fecha_ultimo_seguimiento('[Fecha: 23/12/2024 - Funcionario: Maryory - Seg: "OBJECIÓN"]');
    RAISE NOTICE 'Test 1 - Una fecha: % (esperado: 2024-12-23)', v_test1;
    
    -- Test 2: Texto con múltiples fechas (debe retornar la última)
    v_test2 := extraer_fecha_ultimo_seguimiento(
        '[Fecha: 01/01/2024 - Seg: "AVISO"] [Fecha: 15/06/2024 - Seg: "RADICACIÓN"] [Fecha: 23/12/2024 - Seg: "OBJECIÓN"]'
    );
    RAISE NOTICE 'Test 2 - Múltiples fechas: % (esperado: 2024-12-23)', v_test2;
    
    -- Test 3: Texto sin fechas
    v_test3 := extraer_fecha_ultimo_seguimiento('Texto sin formato de fecha');
    RAISE NOTICE 'Test 3 - Sin fechas: % (esperado: NULL)', v_test3;
END $$;

-- ============================================================================
-- NOTAS:
-- 
-- ✅ Si los tests retornan los valores esperados, la función está OK
-- ⚠️  Si retorna NULL cuando no debería, revisar el formato del texto
-- 📝 Próximo paso: Ejecutar fase_03_funcion_etapa.sql
-- ============================================================================
