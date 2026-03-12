-- Trigger function to process SLA stage extraction on observation changes
-- This function is called automatically when observations are inserted or updated

-- First, create the trigger function
CREATE OR REPLACE FUNCTION process_sla_extraction()
RETURNS TRIGGER AS $$
DECLARE
    v_fecha_aviso DATE;
    v_fecha_notificacion DATE;
    v_observaciones TEXT;
    v_fecha_siniestro DATE;
    v_etapas RECORD;
    v_extraction_errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Get claim data
    SELECT 
        fecha_aviso::DATE,
        fecha_notificacion_aseguradora::DATE,
        observaciones,
        fecha_siniestro::DATE
    INTO 
        v_fecha_aviso,
        v_fecha_notificacion,
        v_observaciones,
        v_fecha_siniestro
    FROM claims
    WHERE id_softseguros = NEW.claim_id;

    -- Initialize stage dates
    v_etapas.etapa_1_fecha := v_fecha_aviso;
    v_etapas.etapa_2_fecha := v_fecha_notificacion;
    v_etapas.etapa_3_fecha := NULL;
    v_etapas.etapa_4_fecha := NULL;
    v_etapas.etapa_5_fecha := NULL;
    v_etapas.etapa_6_fecha := NULL;
    v_etapas.etapa_7_fecha := NULL;
    v_etapas.etapa_8_fecha := NULL;
    v_etapas.etapa_9_fecha := NULL;
    v_etapas.etapa_10_fecha := NULL;
    v_etapas.etapa_11_fecha := NULL;
    v_etapas.etapa_12_fecha := NULL;
    v_etapas.etapa_13_fecha := NULL;
    v_etapas.etapa_14_fecha := NULL;
    v_etapas.etapa_15_fecha := NULL;
    v_etapas.etapa_16_fecha := NULL;

    -- Extract stages 3-16 from observations using regex patterns
    IF v_observaciones IS NOT NULL THEN
        -- Stage 3: AJUSTADOR
        BEGIN
            SELECT (regexp_matches(upper(v_observaciones), 'AJUSTADOR[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 'i'))[1]::DATE
            INTO v_etapas.etapa_3_fecha;
        EXCEPTION WHEN OTHERS THEN
            v_extraction_errors := array_append(v_extraction_errors, 'Stage 3: ' || SQLERRM);
        END;

        -- Stage 4: DOCUMENTOS ADICIONALES
        BEGIN
            SELECT (regexp_matches(upper(v_observaciones), 'DOCUMENTOS ADICIONALES[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 'i'))[1]::DATE
            INTO v_etapas.etapa_4_fecha;
        EXCEPTION WHEN OTHERS THEN
            v_extraction_errors := array_append(v_extraction_errors, 'Stage 4: ' || SQLERRM);
        END;

        -- Stage 5: ASISTENCIA
        BEGIN
            SELECT (regexp_matches(upper(v_observaciones), 'ASISTENCIA[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 'i'))[1]::DATE
            INTO v_etapas.etapa_5_fecha;
        EXCEPTION WHEN OTHERS THEN
            v_extraction_errors := array_append(v_extraction_errors, 'Stage 5: ' || SQLERRM);
        END;

        -- Stage 6: LIQUIDACIÓN
        BEGIN
            SELECT (regexp_matches(upper(v_observaciones), 'LIQUIDACI[ÓO]N[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 'i'))[1]::DATE
            INTO v_etapas.etapa_6_fecha;
        EXCEPTION WHEN OTHERS THEN
            v_extraction_errors := array_append(v_extraction_errors, 'Stage 6: ' || SQLERRM);
        END;

        -- Stage 7: OBJECIÓN
        BEGIN
            SELECT (regexp_matches(upper(v_observaciones), 'OBJECI[ÓO]N[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 'i'))[1]::DATE
            INTO v_etapas.etapa_7_fecha;
        EXCEPTION WHEN OTHERS THEN
            v_extraction_errors := array_append(v_extraction_errors, 'Stage 7: ' || SQLERRM);
        END;

        -- Stage 8: RECONSIDERACIÓN LIQUIDACIÓN
        BEGIN
            SELECT (regexp_matches(upper(v_observaciones), 'RECONSIDERACI[ÓO]N LIQUIDACI[ÓO]N[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 'i'))[1]::DATE
            INTO v_etapas.etapa_8_fecha;
        EXCEPTION WHEN OTHERS THEN
            v_extraction_errors := array_append(v_extraction_errors, 'Stage 8: ' || SQLERRM);
        END;

        -- Stage 9: RECONSIDERACIÓN OBJECIÓN
        BEGIN
            SELECT (regexp_matches(upper(v_observaciones), 'RECONSIDERACI[ÓO]N OBJECI[ÓO]N[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 'i'))[1]::DATE
            INTO v_etapas.etapa_9_fecha;
        EXCEPTION WHEN OTHERS THEN
            v_extraction_errors := array_append(v_extraction_errors, 'Stage 9: ' || SQLERRM);
        END;

        -- Stage 10: DESISTIMIENTO
        BEGIN
            SELECT (regexp_matches(upper(v_observaciones), 'DESISTIMIENTO[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 'i'))[1]::DATE
            INTO v_etapas.etapa_10_fecha;
        EXCEPTION WHEN OTHERS THEN
            v_extraction_errors := array_append(v_extraction_errors, 'Stage 10: ' || SQLERRM);
        END;

        -- Stage 11: RATIFICACIÓN LIQUIDACIÓN
        BEGIN
            SELECT (regexp_matches(upper(v_observaciones), 'RATIFICACI[ÓO]N LIQUIDACI[ÓO]N[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 'i'))[1]::DATE
            INTO v_etapas.etapa_11_fecha;
        EXCEPTION WHEN OTHERS THEN
            v_extraction_errors := array_append(v_extraction_errors, 'Stage 11: ' || SQLERRM);
        END;

        -- Stage 12: RATIFICACIÓN OBJECIÓN
        BEGIN
            SELECT (regexp_matches(upper(v_observaciones), 'RATIFICACI[ÓO]N OBJECI[ÓO]N[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 'i'))[1]::DATE
            INTO v_etapas.etapa_12_fecha;
        EXCEPTION WHEN OTHERS THEN
            v_extraction_errors := array_append(v_extraction_errors, 'Stage 12: ' || SQLERRM);
        END;

        -- Stage 13: PRESCRIPCIÓN
        BEGIN
            SELECT (regexp_matches(upper(v_observaciones), 'PRESCRIPCI[ÓO]N[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 'i'))[1]::DATE
            INTO v_etapas.etapa_13_fecha;
        EXCEPTION WHEN OTHERS THEN
            v_extraction_errors := array_append(v_extraction_errors, 'Stage 13: ' || SQLERRM);
        END;

        -- Stage 14: PROCESO JURÍDICO
        BEGIN
            SELECT (regexp_matches(upper(v_observaciones), 'PROCESO JUR[ÍI]DICO[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 'i'))[1]::DATE
            INTO v_etapas.etapa_14_fecha;
        EXCEPTION WHEN OTHERS THEN
            v_extraction_errors := array_append(v_extraction_errors, 'Stage 14: ' || SQLERRM);
        END;

        -- Stage 15: FINALIZADO
        BEGIN
            SELECT (regexp_matches(upper(v_observaciones), 'FINALIZADO[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 'i'))[1]::DATE
            INTO v_etapas.etapa_15_fecha;
        EXCEPTION WHEN OTHERS THEN
            v_extraction_errors := array_append(v_extraction_errors, 'Stage 15: ' || SQLERRM);
        END;

        -- Stage 16: PAGADO
        BEGIN
            SELECT (regexp_matches(upper(v_observaciones), 'PAGADO[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 'i'))[1]::DATE
            INTO v_etapas.etapa_16_fecha;
        EXCEPTION WHEN OTHERS THEN
            v_extraction_errors := array_append(v_extraction_errors, 'Stage 16: ' || SQLERRM);
        END;
    END IF;

    -- Insert or update siniestro_etapas
    INSERT INTO siniestro_etapas (
        claim_id,
        etapa_1_fecha,
        etapa_2_fecha,
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
        extraction_errors,
        updated_at
    )
    VALUES (
        NEW.claim_id,
        v_etapas.etapa_1_fecha,
        v_etapas.etapa_2_fecha,
        v_etapas.etapa_3_fecha,
        v_etapas.etapa_4_fecha,
        v_etapas.etapa_5_fecha,
        v_etapas.etapa_6_fecha,
        v_etapas.etapa_7_fecha,
        v_etapas.etapa_8_fecha,
        v_etapas.etapa_9_fecha,
        v_etapas.etapa_10_fecha,
        v_etapas.etapa_11_fecha,
        v_etapas.etapa_12_fecha,
        v_etapas.etapa_13_fecha,
        v_etapas.etapa_14_fecha,
        v_etapas.etapa_15_fecha,
        v_etapas.etapa_16_fecha,
        v_extraction_errors,
        NOW()
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
        extraction_errors = EXCLUDED.extraction_errors,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on claims table
DROP TRIGGER IF EXISTS trigger_process_sla_extraction ON claims;
CREATE TRIGGER trigger_process_sla_extraction
    AFTER INSERT OR UPDATE OF observaciones, fecha_aviso, fecha_notificacion_aseguradora
    ON claims
    FOR EACH ROW
    EXECUTE FUNCTION process_sla_extraction();

-- Add comment for documentation
COMMENT ON FUNCTION process_sla_extraction() IS 'Automatically extracts stage dates from observations when claims are inserted or updated';
