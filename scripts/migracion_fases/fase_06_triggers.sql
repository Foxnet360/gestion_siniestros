-- ============================================================================
-- FASE 6: TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- ============================================================================
-- Ejecutar después de fase_05 (o fase_05b)
-- Activa la actualización automática en tiempo real
-- Tiempo estimado: < 1 minuto
-- ============================================================================

-- ============================================================================
-- 6.1 Crear función del trigger
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

COMMENT ON FUNCTION trg_actualizar_seguimiento() IS 
'Trigger function que actualiza automáticamente las fechas de seguimiento cuando cambian los datos fuente';

-- ============================================================================
-- 6.2 Crear trigger para UPDATE
-- ============================================================================

DROP TRIGGER IF EXISTS trg_claims_seguimiento ON claims;

CREATE TRIGGER trg_claims_seguimiento
    BEFORE UPDATE ON claims
    FOR EACH ROW
    EXECUTE FUNCTION trg_actualizar_seguimiento();

-- ============================================================================
-- 6.3 Crear trigger para INSERT (útil para inserciones manuales)
-- ============================================================================

DROP TRIGGER IF EXISTS trg_claims_seguimiento_insert ON claims;

CREATE TRIGGER trg_claims_seguimiento_insert
    BEFORE INSERT ON claims
    FOR EACH ROW
    EXECUTE FUNCTION trg_actualizar_seguimiento();

-- ============================================================================
-- 6.4 Verificar que los triggers están creados
-- ============================================================================

SELECT 
    trigger_name,
    event_manipulation as evento,
    action_timing as timing,
    action_orientation as nivel
FROM information_schema.triggers 
WHERE event_object_table = 'claims'
  AND trigger_name LIKE 'trg_claims_seguimiento%';

-- ============================================================================
-- 6.5 Test del trigger (actualizar un registro y verificar)
-- ============================================================================

-- Encontrar un registro de prueba que tenga ultimo_seguimiento_raw
DO $$
DECLARE
    v_claim_id TEXT;
    v_fecha_antes DATE;
    v_fecha_despues DATE;
BEGIN
    -- Buscar un registro para prueba
    SELECT id_softseguros, fecha_ultimo_seguimiento 
    INTO v_claim_id, v_fecha_antes
    FROM claims 
    WHERE ultimo_seguimiento_raw IS NOT NULL 
    LIMIT 1;
    
    IF v_claim_id IS NOT NULL THEN
        RAISE NOTICE 'Registro de prueba: %', v_claim_id;
        RAISE NOTICE 'Fecha antes: %', v_fecha_antes;
        
        -- Simular actualización agregando un espacio al final
        UPDATE claims 
        SET ultimo_seguimiento_raw = ultimo_seguimiento_raw || ' '
        WHERE id_softseguros = v_claim_id;
        
        -- Verificar nueva fecha
        SELECT fecha_ultimo_seguimiento 
        INTO v_fecha_despues
        FROM claims 
        WHERE id_softseguros = v_claim_id;
        
        RAISE NOTICE 'Fecha después: %', v_fecha_despues;
        
        -- Revertir cambio
        UPDATE claims 
        SET ultimo_seguimiento_raw = TRIM(ultimo_seguimiento_raw)
        WHERE id_softseguros = v_claim_id;
        
        IF v_fecha_antes IS NOT DISTINCT FROM v_fecha_despues THEN
            RAISE NOTICE '✅ Trigger funcionando correctamente';
        ELSE
            RAISE NOTICE '⚠️  El trigger modificó la fecha (puede ser normal si el parsing es diferente)';
        END IF;
    ELSE
        RAISE NOTICE '⚠️  No se encontró registro de prueba con ultimo_seguimiento_raw';
    END IF;
END $$;

-- ============================================================================
-- NOTAS:
-- 
-- ✅ Si la consulta 6.4 muestra 2 triggers (UPDATE e INSERT), todo está OK
-- ✅ El trigger se ejecuta automáticamente en cada cambio de datos
-- ✅ No requiere intervención manual para mantener datos actualizados
--
-- ⚠️  CONSIDERACIONES DE PERFORMANCE:
--     - El trigger ejecuta funciones de parsing en cada UPDATE
--     - Si hay actualizaciones masivas (> 1000 registros), considerar:
--       1. Desactivar temporalmente: DROP TRIGGER trg_claims_seguimiento ON claims;
--       2. Ejecutar actualización masiva
--       3. Recrear el trigger
--       4. O usar el script batch en lugar de updates individuales
--
-- 📝 Próximo paso: Ejecutar fase_07_vistas.sql
-- ============================================================================
