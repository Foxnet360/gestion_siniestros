-- ============================================================================
-- SCRIPT SQL: AUTOMATIZACIÓN DE SEGUIMIENTO DE FECHAS EN SINIESTROS
-- ============================================================================
-- Base de datos: Supabase (PostgreSQL)
-- Tabla: claims
-- 
-- REQUERIMIENTOS:
-- 1. Crear campos fecha_ultimo_seguimiento y fecha_proximo_seguimiento
-- 2. Migrar fechas desde ultimo_seguimiento_raw
-- 3. Calcular fecha_proximo_seguimiento según etapa actual
-- ============================================================================

-- ============================================================================
-- REQUERIMIENTO 1: CREAR CAMPOS NUEVOS
-- ============================================================================

-- Agregar campo fecha_ultimo_seguimiento (nullable inicialmente)
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS fecha_ultimo_seguimiento DATE;

-- Agregar campo fecha_proximo_seguimiento
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS fecha_proximo_seguimiento DATE;

-- Agregar índices para mejorar performance en búsquedas por fecha
CREATE INDEX IF NOT EXISTS idx_claims_fecha_ultimo_seguimiento 
ON claims(fecha_ultimo_seguimiento);

CREATE INDEX IF NOT EXISTS idx_claims_fecha_proximo_seguimiento 
ON claims(fecha_proximo_seguimiento);

-- ============================================================================
-- REQUERIMIENTO 2: FUNCIÓN PARA EXTRAER FECHA DE TEXTO
-- ============================================================================

-- Función reutilizable para extraer fecha del formato:
-- [Fecha: DD/MM/YYYY - Funcionario: Nombre ...]
CREATE OR REPLACE FUNCTION extraer_fecha_seguimiento(texto TEXT)
RETURNS DATE AS $$
DECLARE
    fecha_str TEXT;
    dia INT;
    mes INT;
    anio INT;
    fecha_resultado DATE;
BEGIN
    -- Extraer el patrón DD/MM/YYYY después de "[Fecha: "
    -- Buscamos el patrón: [Fecha: XX/XX/XXXX
    fecha_str := substring(texto from '\[Fecha:\s*(\d{2}/\d{2}/\d{4})');
    
    -- Si no encuentra el patrón completo, intentar buscar cualquier fecha DD/MM/YYYY
    IF fecha_str IS NULL OR fecha_str = '' THEN
        fecha_str := substring(texto from '(\d{2}/\d{2}/\d{4})');
    END IF;
    
    -- Si encontramos una fecha, convertirla
    IF fecha_str IS NOT NULL AND fecha_str != '' THEN
        -- Extraer componentes
        dia := CAST(split_part(fecha_str, '/', 1) AS INT);
        mes := CAST(split_part(fecha_str, '/', 2) AS INT);
        anio := CAST(split_part(fecha_str, '/', 3) AS INT);
        
        -- Validar que la fecha sea válida
        IF dia BETWEEN 1 AND 31 AND mes BETWEEN 1 AND 12 AND anio BETWEEN 2000 AND 2100 THEN
            fecha_resultado := make_date(anio, mes, dia);
            RETURN fecha_resultado;
        END IF;
    END IF;
    
    RETURN NULL;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- REQUERIMIENTO 2: MIGRAR FECHAS EXISTENTES
-- ============================================================================

-- Actualizar fecha_ultimo_seguimiento extrayendo del campo ultimo_seguimiento_raw
UPDATE claims
SET fecha_ultimo_seguimiento = extraer_fecha_seguimiento(ultimo_seguimiento_raw)
WHERE ultimo_seguimiento_raw IS NOT NULL 
  AND ultimo_seguimiento_raw != ''
  AND extraer_fecha_seguimiento(ultimo_seguimiento_raw) IS NOT NULL;

-- Verificar cuántos registros se actualizaron
-- SELECT COUNT(*) as registros_actualizados 
-- FROM claims 
-- WHERE fecha_ultimo_seguimiento IS NOT NULL;

-- ============================================================================
-- REQUERIMIENTO 3: FUNCIÓN PARA CALCULAR FECHA PRÓXIMO SEGUIMIENTO
-- ============================================================================

-- Función para calcular la fecha del próximo seguimiento según la etapa
CREATE OR REPLACE FUNCTION calcular_fecha_proximo_seguimiento(
    p_fecha_ultimo_seguimiento DATE,
    p_estado_interno TEXT,
    p_prescripcion_ordinaria BOOLEAN DEFAULT NULL,
    p_fecha_aviso DATE DEFAULT NULL
)
RETURNS DATE AS $$
DECLARE
    fecha_resultado DATE;
    dias_habiles INT;
BEGIN
    -- Si no hay fecha de último seguimiento, no calcular
    IF p_fecha_ultimo_seguimiento IS NULL THEN
        RETURN NULL;
    END IF;

    -- Calcular según la etapa actual
    CASE p_estado_interno
        -- ETAPA 1: AVISO SINIESTRO
        WHEN 'AVISO SINIESTRO' THEN
            -- +3 días hábiles
            fecha_resultado := p_fecha_ultimo_seguimiento + INTERVAL '5 days'; -- Aproximación: 3 hábiles = ~5 calendario
            
        -- ETAPA 2: RADICACIÓN COMPAÑÍA
        WHEN 'RADICACIÓN COMPAÑÍA' THEN
            -- +1 mes
            fecha_resultado := p_fecha_ultimo_seguimiento + INTERVAL '1 month';
            
        -- ETAPA 3: AJUSTADOR (y relacionados)
        WHEN 'AJUSTADOR' THEN
            -- [PENDIENTE - REQUIERE DATOS DE EXCEL]
            -- TODO: Definir días según Excel "número de días transcurridos por etapa"
            fecha_resultado := NULL;
            
        -- ETAPA 4: DOCUMENTOS ADICIONALES
        WHEN 'DOCUMENTOS ADICIONALES' THEN
            -- [PENDIENTE - REQUIERE DATOS DE EXCEL]
            fecha_resultado := NULL;
            
        -- ETAPA 5: DOCUMENTOS COMPLETOS
        WHEN 'DOCUMENTOS COMPLETOS' THEN
            -- [PENDIENTE - REQUIERE DATOS DE EXCEL]
            fecha_resultado := NULL;
            
        -- ETAPA 6: DEVOLUCIÓN DE DOCUMENTOS
        WHEN 'DEVOLUCIÓN DE DOCUMENTOS' THEN
            -- [PENDIENTE - REQUIERE DATOS DE EXCEL]
            fecha_resultado := NULL;
            
        -- ETAPA 7: LIQUIDACIÓN
        WHEN 'LIQUIDACIÓN' THEN
            -- [PENDIENTE - REQUIERE DATOS DE EXCEL]
            fecha_resultado := NULL;
            
        -- ETAPA 8: RECONSIDERACIÓN LIQUIDACIÓN
        WHEN 'RECONSIDERACIÓN LIQUIDACIÓN' THEN
            -- Variable, definir manualmente
            fecha_resultado := NULL;
            
        -- ETAPA 9: RECONSIDERACIÓN OBJECIÓN
        WHEN 'RECONSIDERACION OBJECIÓN' THEN
            -- Variable, definir manualmente
            fecha_resultado := NULL;
            
        -- ETAPA 10: DESISTIMIENTO
        WHEN 'DESISTIMIENTO' THEN
            -- [PENDIENTE - REQUIERE DATOS DE EXCEL]
            fecha_resultado := NULL;
            
        -- ETAPA 11: RATIFICACIÓN LIQUIDACIÓN
        WHEN 'RATIFICACIÓN LIQUIDACIÓN' THEN
            -- [PENDIENTE - REQUIERE DATOS DE EXCEL]
            fecha_resultado := NULL;
            
        -- ETAPA 12: RATIFICACIÓN OBJECIÓN
        WHEN 'RATIFICACIÓN OBJECIÓN' THEN
            -- [PENDIENTE - REQUIERE DATOS DE EXCEL]
            fecha_resultado := NULL;
            
        -- ETAPA 13: PRESCRIPCIÓN
        WHEN 'PRESCRIPCIÓN' THEN
            -- +2 años (ordinaria) o +5 años (extraordinaria)
            IF p_prescripcion_ordinaria = true THEN
                fecha_resultado := p_fecha_ultimo_seguimiento + INTERVAL '2 years';
            ELSE
                fecha_resultado := p_fecha_ultimo_seguimiento + INTERVAL '5 years';
            END IF;
            
        -- ETAPA 14: PROCESO JURÍDICO
        WHEN 'PROCESO JURÍDICO' THEN
            -- [PENDIENTE - REQUIERE DATOS DE EXCEL]
            fecha_resultado := NULL;
            
        -- ETAPA 15: FIRMA INDEMNIZACIÓN / EN PROCESO PAGO
        WHEN 'FIRMA INDEMNIZACIÓN' THEN
            -- [PENDIENTE - REQUIERE DATOS DE EXCEL]
            fecha_resultado := NULL;
            
        WHEN 'EN PROCESO PAGO INDEMNIZACIÓN' THEN
            -- [PENDIENTE - REQUIERE DATOS DE EXCEL]
            fecha_resultado := NULL;
            
        -- ETAPA 16: PAGADO
        WHEN 'PAGADO' THEN
            -- +30 días hábiles desde aviso (si existe fecha_aviso)
            IF p_fecha_aviso IS NOT NULL THEN
                fecha_resultado := p_fecha_aviso + INTERVAL '42 days'; -- Aproximación: 30 hábiles = ~42 calendario
            ELSE
                fecha_resultado := p_fecha_ultimo_seguimiento + INTERVAL '42 days';
            END IF;
            
        -- ESTADOS ADICIONALES FASE 1
        WHEN 'OBTENCIÓN SOPORTES' THEN
            -- [PENDIENTE - REQUIERE DATOS DE EXCEL]
            fecha_resultado := NULL;
            
        WHEN 'ESTUDIO TÉCNICO CORREDORES' THEN
            -- [PENDIENTE - REQUIERE DATOS DE EXCEL]
            fecha_resultado := NULL;
            
        -- OTROS
        WHEN 'OBJECIÓN' THEN
            -- [PENDIENTE - REQUIERE DATOS DE EXCEL]
            fecha_resultado := NULL;
            
        WHEN 'FINALIZADO' THEN
            -- No requiere seguimiento
            fecha_resultado := NULL;
            
        ELSE
            -- Estado no reconocido, no calcular
            fecha_resultado := NULL;
    END CASE;
    
    RETURN fecha_resultado;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- REQUERIMIENTO 3: ACTUALIZAR FECHA PRÓXIMO SEGUIMIENTO
-- ============================================================================

-- Actualizar fecha_proximo_seguimiento para todos los registros
UPDATE claims
SET fecha_proximo_seguimiento = calcular_fecha_proximo_seguimiento(
    fecha_ultimo_seguimiento,
    estado_interno,
    prescripcion_ordinaria,
    fecha_aviso::DATE
)
WHERE fecha_ultimo_seguimiento IS NOT NULL;

-- ============================================================================
-- REQUERIMIENTO 4: TRIGGER PARA ACTUALIZACIÓN AUTOMÁTICA (OPCIONAL)
-- ============================================================================

-- Función que se ejecuta en el trigger
CREATE OR REPLACE FUNCTION trigger_actualizar_fechas_seguimiento()
RETURNS TRIGGER AS $$
BEGIN
    -- Si cambió ultimo_seguimiento_raw, actualizar fecha_ultimo_seguimiento
    IF NEW.ultimo_seguimiento_raw IS DISTINCT FROM OLD.ultimo_seguimiento_raw THEN
        NEW.fecha_ultimo_seguimiento := extraer_fecha_seguimiento(NEW.ultimo_seguimiento_raw);
    END IF;
    
    -- Si cambió estado_interno o fecha_ultimo_seguimiento, recalcular fecha_proximo_seguimiento
    IF NEW.estado_interno IS DISTINCT FROM OLD.estado_interno 
       OR NEW.fecha_ultimo_seguimiento IS DISTINCT FROM OLD.fecha_ultimo_seguimiento 
       OR NEW.prescripcion_ordinaria IS DISTINCT FROM OLD.prescripcion_ordinaria 
       OR NEW.fecha_aviso IS DISTINCT FROM OLD.fecha_aviso THEN
        
        NEW.fecha_proximo_seguimiento := calcular_fecha_proximo_seguimiento(
            NEW.fecha_ultimo_seguimiento,
            NEW.estado_interno,
            NEW.prescripcion_ordinaria,
            NEW.fecha_aviso::DATE
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trg_actualizar_fechas_seguimiento ON claims;

CREATE TRIGGER trg_actualizar_fechas_seguimiento
    BEFORE UPDATE ON claims
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_fechas_seguimiento();

-- Nota: También puedes crear un trigger para INSERT si es necesario:
-- CREATE TRIGGER trg_insertar_fechas_seguimiento
--     BEFORE INSERT ON claims
--     FOR EACH ROW
--     EXECUTE FUNCTION trigger_actualizar_fechas_seguimiento();

-- ============================================================================
-- VISTA PARA MONITOREO DE SEGUIMIENTOS
-- ============================================================================

CREATE OR REPLACE VIEW vw_seguimientos_pendientes AS
SELECT 
    id_softseguros,
    numero_siniestro,
    asegurado,
    estado_interno,
    fecha_ultimo_seguimiento,
    fecha_proximo_seguimiento,
    CASE 
        WHEN fecha_proximo_seguimiento < CURRENT_DATE THEN 'VENCIDO'
        WHEN fecha_proximo_seguimiento <= CURRENT_DATE + INTERVAL '3 days' THEN 'PRÓXIMO A VENCER'
        ELSE 'OK'
    END as estado_seguimiento,
    CURRENT_DATE - fecha_ultimo_seguimiento as dias_desde_ultimo_seguimiento,
    fecha_proximo_seguimiento - CURRENT_DATE as dias_para_proximo_seguimiento
FROM claims
WHERE fecha_proximo_seguimiento IS NOT NULL
   OR fecha_ultimo_seguimiento IS NOT NULL
ORDER BY 
    CASE 
        WHEN fecha_proximo_seguimiento < CURRENT_DATE THEN 0
        WHEN fecha_proximo_seguimiento <= CURRENT_DATE + INTERVAL '3 days' THEN 1
        ELSE 2
    END,
    fecha_proximo_seguimiento;

-- ============================================================================
-- CONSULTAS DE VERIFICACIÓN
-- ============================================================================

-- Verificar distribución de fechas extraídas
-- SELECT 
--     COUNT(*) as total_registros,
--     COUNT(fecha_ultimo_seguimiento) as con_fecha_extraida,
--     COUNT(*) - COUNT(fecha_ultimo_seguimiento) as sin_fecha_extraida
-- FROM claims;

-- Verificar registros por etapa con fechas calculadas
-- SELECT 
--     estado_interno,
--     COUNT(*) as total,
--     COUNT(fecha_proximo_seguimiento) as con_fecha_proxima,
--     AVG(fecha_proximo_seguimiento - fecha_ultimo_seguimiento) as promedio_dias
-- FROM claims
-- GROUP BY estado_interno
-- ORDER BY estado_interno;

-- Verificar seguimientos vencidos o próximos a vencer
-- SELECT * FROM vw_seguimientos_pendientes 
-- WHERE estado_seguimiento IN ('VENCIDO', 'PRÓXIMO A VENCER')
-- LIMIT 20;

-- ============================================================================
-- DATOS ADICIONALES NECESARIOS PARA COMPLETAR
-- ============================================================================

/*
Para completar las etapas marcadas como [PENDIENTE], se requiere:

1. ACCESO AL EXCEL "número de días transcurridos por etapa" (hoja 2)
   - Necesito los días específicos para cada etapa:
     * ETAPA 3: AJUSTADOR
     * ETAPA 4: DOCUMENTOS ADICIONALES
     * ETAPA 5: DOCUMENTOS COMPLETOS
     * ETAPA 6: DEVOLUCIÓN DE DOCUMENTOS
     * ETAPA 7: LIQUIDACIÓN
     * ETAPA 10: DESISTIMIENTO
     * ETAPA 11: RATIFICACIÓN LIQUIDACIÓN
     * ETAPA 12: RATIFICACIÓN OBJECIÓN
     * ETAPA 14: PROCESO JURÍDICO
     * ETAPA 15: FIRMA INDEMNIZACIÓN / EN PROCESO PAGO INDEMNIZACIÓN
     * OBTENCIÓN SOPORTES
     * ESTUDIO TÉCNICO CORREDORES
     * OBJECIÓN

2. ¿Son días hábiles o días calendario?
   - Actualmente uso aproximación: 3 hábiles = 5 calendario, 30 hábiles = 42 calendario
   - Para cálculos exactos de días hábiles se necesitaría una función que excluya fines de semana y festivos

3. Para ETAPA 13 (PRESCRIPCIÓN):
   - ¿El campo prescripcion_ordinaria es BOOLEAN?
   - ¿Cómo se determina si es ordinaria vs extraordinaria?
   - ¿Hay otros campos relacionados (fecha prescripción, etc.)?

4. Para ETAPA 16 (PAGADO):
   - Confirmar que fecha_aviso es el campo correcto para calcular "desde aviso"
   - ¿Es +30 días hábiles desde fecha_aviso o desde fecha del pago?

Una vez proporcionados estos datos, actualizaré la función calcular_fecha_proximo_seguimiento()
con los valores correctos.
*/
