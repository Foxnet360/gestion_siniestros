-- ============================================================================
-- SCRIPT SQL COMPLETO: AUTOMATIZACIÓN DE SEGUIMIENTO DE FECHAS EN SINIESTROS
-- ============================================================================
-- Base de datos: Supabase (PostgreSQL)
-- Fecha: 2024
-- 
-- DESCRIPCIÓN:
-- Este script implementa el seguimiento automático de fechas para la gestión
-- de siniestros, extrayendo información del campo ultimo_seguimiento_raw
-- y calculando fechas de próximo seguimiento según la etapa actual.
--
-- REGLAS DE NEGOCIO:
-- - Etapa 1 (Aviso Siniestro): fecha_aviso del sistema
-- - Etapa 2 (Radicación): fecha_notificacion_aseguradora del sistema  
-- - Etapas 3-16: Extraídas de ultimo_seguimiento_raw buscando keywords
-- - Etapas calculables (1, 2, 13): Calculan fecha_proximo_seguimiento
-- - Etapa 13 (Prescripción): Usa prescripcion_ordinaria o extraordinaria
-- ============================================================================

-- ============================================================================
-- FASE 1: CREAR CAMPOS NUEVOS EN TABLA CLAIMS
-- ============================================================================

-- Agregar campos de seguimiento
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS fecha_ultimo_seguimiento DATE,
ADD COLUMN IF NOT EXISTS fecha_proximo_seguimiento DATE;

-- Comentarios para documentación
COMMENT ON COLUMN claims.fecha_ultimo_seguimiento IS 'Última fecha extraída del campo ultimo_seguimiento_raw';
COMMENT ON COLUMN claims.fecha_proximo_seguimiento IS 'Fecha calculada del próximo seguimiento según etapa (solo etapas 1, 2, 13)';

-- Crear índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_claims_fecha_proximo_vencidos 
ON claims(fecha_proximo_seguimiento) 
WHERE fecha_proximo_seguimiento < CURRENT_DATE;

CREATE INDEX IF NOT EXISTS idx_claims_fecha_proximo_proximos 
ON claims(fecha_proximo_seguimiento) 
WHERE fecha_proximo_seguimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days';

CREATE INDEX IF NOT EXISTS idx_claims_fecha_ultimo 
ON claims(fecha_ultimo_seguimiento DESC);

-- ============================================================================
-- FASE 2: FUNCIÓN PARA EXTRAER ÚLTIMA FECHA DE SEGUIMIENTO
-- ============================================================================

CREATE OR REPLACE FUNCTION extraer_fecha_ultimo_seguimiento(p_texto TEXT)
RETURNS DATE AS $$
DECLARE
    v_fecha_str TEXT;
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
'Extrae la fecha más reciente del campo ultimo_seguimiento_raw. Formato esperado: [Fecha: DD/MM/YYYY';

-- ============================================================================
-- FASE 3: FUNCIÓN PARA EXTRAER FECHA DE UNA ETAPA ESPECÍFICA
-- ============================================================================

CREATE OR REPLACE FUNCTION extraer_fecha_etapa(p_texto TEXT, p_etapa_num INT)
RETURNS DATE AS $$
DECLARE
    v_keywords TEXT[];
    v_fecha DATE;
    v_pattern TEXT;
BEGIN
    -- Definir keywords según la etapa (basado en documentación "N Días X Etapa")
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
    -- Estrategia: Buscar keyword en el texto, luego buscar la fecha más cercana
    -- hacia atrás (patrón típico: [Fecha: XX/XX/XXXX ... Seg: "KEYWORD" ...])
    
    SELECT MAX(fecha_encontrada.fecha) INTO v_fecha
    FROM (
        SELECT extraer_fecha_ultimo_seguimiento(
            -- Extraer un segmento de texto alrededor del keyword
            -- Buscamos hacia atrás desde el keyword para encontrar la fecha
            substring(
                p_texto 
                FROM 
                GREATEST(1, POSITION(UPPER(keyword) IN UPPER(p_texto)) - 200)
                FOR 
                LEAST(LENGTH(p_texto), POSITION(UPPER(keyword) IN UPPER(p_texto)) + 100)
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
'Extrae la fecha de una etapa específica (3-16) del texto de observaciones. Busca keywords definidos.';

-- ============================================================================
-- FASE 4: FUNCIÓN PARA CALCULAR FECHA DE PRÓXIMO SEGUIMIENTO
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
        -- Regla: Usar la fecha de prescripción más restrictiva (la que vence primero)
        -- Si ambas existen, el usuario debe decidir manualmente
        WHEN 'PRESCRIPCIÓN', 'PRESCRIPCION' THEN
            IF p_prescripcion_ord IS NOT NULL AND p_prescripcion_ext IS NOT NULL THEN
                -- Ambas existen: devolver la más cercana (más restrictiva)
                -- El usuario decidirá cuál aplica según "conocido" vs "sin conocer"
                v_fecha_resultado := LEAST(p_prescripcion_ord, p_prescripcion_ext);
            ELSIF p_prescripcion_ord IS NOT NULL THEN
                -- Solo ordinaria (hecho conocido, 2 años)
                v_fecha_resultado := p_prescripcion_ord;
            ELSIF p_prescripcion_ext IS NOT NULL THEN
                -- Solo extraordinaria (hecho sin conocer, 5 años)
                v_fecha_resultado := p_prescripcion_ext;
            ELSE
                -- No hay fechas calculadas
                v_fecha_resultado := NULL;
            END IF;
            
        -- OTRAS ETAPAS (3-12, 14-16): No calculables automáticamente
        -- Estas etapas tienen duración variable según el caso
        ELSE
            v_fecha_resultado := NULL;
    END CASE;
    
    RETURN v_fecha_resultado;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calcular_fecha_proximo_seguimiento(DATE, TEXT, DATE, DATE) IS 
'Calcula la fecha de próximo seguimiento según etapa. Solo calcula para etapas 1, 2 y 13.';

-- ============================================================================
-- FASE 5: MIGRACIÓN DE DATOS HISTÓRICOS
-- ============================================================================

-- Nota: Ejecutar estas migraciones en lotes si hay más de 10,000 registros
-- para evitar bloqueos prolongados.

-- Paso 5.1: Actualizar fecha_ultimo_seguimiento en claims
-- Extrayendo la última fecha de ultimo_seguimiento_raw
UPDATE claims
SET fecha_ultimo_seguimiento = extraer_fecha_ultimo_seguimiento(ultimo_seguimiento_raw)
WHERE ultimo_seguimiento_raw IS NOT NULL 
  AND ultimo_seguimiento_raw != ''
  AND (fecha_ultimo_seguimiento IS NULL 
       OR fecha_ultimo_seguimiento != extraer_fecha_ultimo_seguimiento(ultimo_seguimiento_raw));

-- Verificación (descomentar para ver resultados):
-- SELECT 
--     COUNT(*) as total_registros,
--     COUNT(fecha_ultimo_seguimiento) as con_fecha_extraida,
--     COUNT(*) - COUNT(fecha_ultimo_seguimiento) as sin_fecha
-- FROM claims;

-- Paso 5.2: Calcular fecha_proximo_seguimiento para etapas calculables (1, 2, 13)
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

-- Paso 5.3: Poblar/Actualizar tabla siniestro_etapas
-- Estrategia: UPSERT (insertar si no existe, actualizar si existe y hay cambios)

INSERT INTO siniestro_etapas (
    claim_id,
    -- Etapas 1-2: Desde campos del sistema
    etapa_1_fecha,
    etapa_2_fecha,
    -- Etapas 3-16: Extraídas del parsing
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

-- ============================================================================
-- FASE 6: TRIGGER PARA ACTUALIZACIÓN AUTOMÁTICA
-- ============================================================================

CREATE OR REPLACE FUNCTION trg_actualizar_seguimiento()
RETURNS TRIGGER AS $$
BEGIN
    -- Si cambió el texto de seguimiento o fechas del sistema
    IF NEW.ultimo_seguimiento_raw IS DISTINCT FROM OLD.ultimo_seguimiento_raw
       OR NEW.fecha_aviso IS DISTINCT FROM OLD.fecha_aviso
       OR NEW.fecha_notificacion_aseguradora IS DISTINCT FROM OLD.fecha_notificacion_aseguradora THEN
        
        -- Actualizar fecha último seguimiento
        NEW.fecha_ultimo_seguimiento := extraer_fecha_ultimo_seguimiento(NEW.ultimo_seguimiento_raw);
    END IF;
    
    -- Si cambió algo que afecta el cálculo de próximo seguimiento
    IF NEW.estado_softseguros IS DISTINCT FROM OLD.estado_softseguros
       OR NEW.fecha_ultimo_seguimiento IS DISTINCT FROM OLD.fecha_ultimo_seguimiento 
       OR NEW.prescripcion_ordinaria IS DISTINCT FROM OLD.prescripcion_ordinaria
       OR NEW.prescripcion_extraordinaria IS DISTINCT FROM OLD.prescripcion_extraordinaria THEN
       
        NEW.fecha_proximo_seguimiento := calcular_fecha_proximo_seguimiento(
            NEW.fecha_ultimo_seguimiento,
            NEW.estado_softseguros,
            NEW.prescripcion_ordinaria,
            NEW.prescripcion_extraordinaria
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger existente si existe (para recrear)
DROP TRIGGER IF EXISTS trg_claims_seguimiento ON claims;

-- Crear trigger para UPDATE
CREATE TRIGGER trg_claims_seguimiento
    BEFORE UPDATE ON claims
    FOR EACH ROW
    EXECUTE FUNCTION trg_actualizar_seguimiento();

-- Crear trigger para INSERT (opcional, útil si se insertan claims manualmente)
DROP TRIGGER IF EXISTS trg_claims_seguimiento_insert ON claims;

CREATE TRIGGER trg_claims_seguimiento_insert
    BEFORE INSERT ON claims
    FOR EACH ROW
    EXECUTE FUNCTION trg_actualizar_seguimiento();

-- ============================================================================
-- FASE 7: VISTAS DE MONITOREO Y REPORTES
-- ============================================================================

-- Vista: Alertas de seguimientos vencidos o próximos a vencer
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
    c.prioridad
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
'Muestra siniestros con seguimientos vencidos o próximos a vencer. Ordenados por prioridad.';

-- Vista: Resumen de extracción de etapas
CREATE OR REPLACE VIEW vw_resumen_extraccion_etapas AS
SELECT 
    'Total Siniestros' as metrica,
    COUNT(*)::TEXT as valor
FROM claims

UNION ALL

SELECT 
    'Con Fecha Último Seguimiento',
    COUNT(*)::TEXT
FROM claims 
WHERE fecha_ultimo_seguimiento IS NOT NULL

UNION ALL

SELECT 
    'Con Fecha Próximo Seguimiento (Calculada)',
    COUNT(*)::TEXT
FROM claims 
WHERE fecha_proximo_seguimiento IS NOT NULL

UNION ALL

SELECT 
    'Seguimientos Vencidos',
    COUNT(*)::TEXT
FROM claims 
WHERE fecha_proximo_seguimiento < CURRENT_DATE

UNION ALL

SELECT 
    'Seguimientos Próximos (3 días)',
    COUNT(*)::TEXT
FROM claims 
WHERE fecha_proximo_seguimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days';

-- Vista: KPI de etapas completadas (para dashboard)
CREATE OR REPLACE VIEW vw_kpi_etapas AS
SELECT 
    se.claim_id,
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
    se.etapa_2_fecha - se.etapa_1_fecha as duracion_etapa_1,
    se.etapa_3_fecha - se.etapa_2_fecha as duracion_etapa_2
    -- Agregar más duraciones según necesidad
FROM siniestro_etapas se
WHERE se.is_active = TRUE;

-- ============================================================================
-- FASE 8: CONSULTAS DE VERIFICACIÓN (DESCOMENTAR PARA EJECUTAR)
-- ============================================================================

/*
-- Verificar muestra de extracciones
SELECT 
    id_softseguros,
    numero_siniestro,
    LEFT(ultimo_seguimiento_raw, 100) as texto_muestra,
    fecha_ultimo_seguimiento,
    fecha_proximo_seguimiento,
    estado_softseguros
FROM claims
WHERE fecha_ultimo_seguimiento IS NOT NULL
LIMIT 20;

-- Verificar distribución por etapa calculable
SELECT 
    estado_softseguros,
    COUNT(*) as total,
    COUNT(fecha_proximo_seguimiento) as con_fecha_calculada,
    AVG(fecha_proximo_seguimiento - fecha_ultimo_seguimiento) as promedio_dias
FROM claims
WHERE estado_softseguros IN ('AVISO SINIESTRO', 'RADICACIÓN COMPAÑÍA', 'PRESCRIPCIÓN')
GROUP BY estado_softseguros;

-- Verificar siniestro_etapas poblada
SELECT 
    COUNT(*) as total_registros,
    COUNT(CASE WHEN etapa_1_fecha IS NOT NULL THEN 1 END) as con_etapa_1,
    COUNT(CASE WHEN etapa_2_fecha IS NOT NULL THEN 1 END) as con_etapa_2,
    COUNT(CASE WHEN etapa_3_fecha IS NOT NULL THEN 1 END) as con_etapa_3,
    COUNT(CASE WHEN etapa_16_fecha IS NOT NULL THEN 1 END) as con_etapa_16
FROM siniestro_etapas;

-- Verificar alertas actuales
SELECT * FROM vw_seguimientos_alertas WHERE estado_alerta != 'OK' LIMIT 20;
*/

-- ============================================================================
-- FASE 9: NOTAS Y RECOMENDACIONES
-- ============================================================================

/*
RECOMENDACIONES POST-IMPLEMENTACIÓN:

1. EJECUTAR EN AMBIENTE DE PRUEBA PRIMERO
   - Verificar que las funciones extraigan correctamente las fechas
   - Validar muestra de 50-100 registros manualmente

2. MONITOREO DE ERRORES
   - Crear un log de errores de parsing si es necesario
   - Identificar patrones de texto que no se están parseando correctamente

3. OPTIMIZACIÓN PARA GRANDES VOLÚMENES
   Si hay más de 100,000 registros, ejecutar la migración en lotes:
   
   DO $$
   DECLARE
       batch_size INT := 1000;
       total_updated INT := 0;
   BEGIN
       LOOP
           WITH batch AS (
               SELECT id_softseguros 
               FROM claims 
               WHERE fecha_ultimo_seguimiento IS NULL 
                   AND ultimo_seguimiento_raw IS NOT NULL
               LIMIT batch_size
           )
           UPDATE claims c
           SET fecha_ultimo_seguimiento = extraer_fecha_ultimo_seguimiento(ultimo_seguimiento_raw)
           FROM batch b
           WHERE c.id_softseguros = b.id_softseguros;
           
           GET DIAGNOSTICS total_updated = ROW_COUNT;
           EXIT WHEN total_updated = 0;
           
           COMMIT;
           PERFORM pg_sleep(0.5); -- Pausa para no saturar
       END LOOP;
   END $$;

4. MANTENIMIENTO PERIÓDICO
   - Ejecutar actualización masiva mensual para cubrir casos donde el trigger
     no se disparó (importaciones masivas, etc.)
   
   UPDATE claims
   SET fecha_ultimo_seguimiento = extraer_fecha_ultimo_seguimiento(ultimo_seguimiento_raw)
   WHERE ultimo_seguimiento_raw IS NOT NULL
     AND (fecha_ultimo_seguimiento IS NULL 
          OR updated_at > fecha_ultimo_seguimiento);

5. MEJORAS FUTURAS CONSIDERADAS:
   - Implementar cálculo de días hábiles reales (excluyendo fines de semana y festivos)
   - Agregar campo booleano "requiere_atencion_manual" para etapas 8-9, 10-12, 14-15
   - Crear notificaciones automáticas cuando un seguimiento está próximo a vencer
   - Agregar métricas de tiempo promedio por etapa basadas en siniestro_etapas

6. CONSIDERACIONES LEGALES:
   - Etapa 1: +3 días calendario (Código Comercio Art. 1075)
   - Etapa 2: +1 mes calendario (Código Comercio Art. 1080)
   - Etapa 13: Depende de tipo de prescripción (2 o 5 años)
   - Si se requiere precisión legal estricta, considerar implementar
     calendario de días hábiles judiciales
*/

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
