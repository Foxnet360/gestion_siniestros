-- Migration: Create database function for prescription date calculation
-- Created: 2026-03-06

-- Function to calculate prescription dates for a specific claim
CREATE OR REPLACE FUNCTION calculate_prescription_dates(claim_id UUID)
RETURNS TABLE (
    fecha_prescripcion_ordinaria DATE,
    fecha_prescripcion_extraordinaria DATE
) AS $$
DECLARE
    v_fecha_ocurrencia DATE;
    v_ramo VARCHAR;
    v_extraordinary_ramos JSONB;
    v_ordinary_years INT;
    v_extraordinary_years INT;
BEGIN
    -- Get claim data
    SELECT c.fecha_ocurrencia, c.ramo 
    INTO v_fecha_ocurrencia, v_ramo
    FROM claims c
    WHERE c.id = claim_id;
    
    -- If no fecha_ocurrencia, return NULL
    IF v_fecha_ocurrencia IS NULL THEN
        RETURN QUERY SELECT NULL::DATE, NULL::DATE;
        RETURN;
    END IF;
    
    -- Get prescription rules from app_config
    SELECT config_value->'ordinary'->>'years',
           config_value->'extraordinary'->>'years',
           config_value->'extraordinary'->'includes'
    INTO v_ordinary_years, v_extraordinary_years, v_extraordinary_ramos
    FROM app_config
    WHERE config_key = 'prescription_rules';
    
    -- Use defaults if config not found
    IF v_ordinary_years IS NULL THEN
        v_ordinary_years := 2;
    END IF;
    
    IF v_extraordinary_years IS NULL THEN
        v_extraordinary_years := 5;
    END IF;
    
    -- Calculate ordinary prescription (2 years)
    fecha_prescripcion_ordinaria := v_fecha_ocurrencia + (v_ordinary_years || ' years')::INTERVAL;
    
    -- Check if ramo requires extraordinary prescription (5 years)
    IF v_extraordinary_ramos IS NOT NULL AND v_ramo = ANY(ARRAY(SELECT jsonb_array_elements_text(v_extraordinary_ramos))) THEN
        fecha_prescripcion_extraordinaria := v_fecha_ocurrencia + (v_extraordinary_years || ' years')::INTERVAL;
    ELSE
        fecha_prescripcion_extraordinaria := NULL;
    END IF;
    
    RETURN QUERY SELECT fecha_prescripcion_ordinaria, fecha_prescripcion_extraordinaria;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_prescription_dates(UUID) IS 'Calcula las fechas de prescripción ordinaria y extraordinaria para un siniestro dado';

-- Function to update prescription dates for a specific claim
CREATE OR REPLACE FUNCTION update_claim_prescription_dates(claim_id UUID)
RETURNS VOID AS $$
DECLARE
    v_ordinaria DATE;
    v_extraordinaria DATE;
BEGIN
    -- Calculate prescription dates
    SELECT fecha_prescripcion_ordinaria, fecha_prescripcion_extraordinaria
    INTO v_ordinaria, v_extraordinaria
    FROM calculate_prescription_dates(claim_id);
    
    -- Update the claim
    UPDATE claims
    SET fecha_prescripcion_ordinaria = v_ordinaria,
        fecha_prescripcion_extraordinaria = v_extraordinaria,
        updatedAt = NOW()
    WHERE id = claim_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_claim_prescription_dates(UUID) IS 'Actualiza las fechas de prescripción de un siniestro específico';

-- Function to batch update all claims without prescription dates
CREATE OR REPLACE FUNCTION batch_update_prescription_dates()
RETURNS TABLE (
    processed_count INT,
    error_count INT
) AS $$
DECLARE
    v_claim RECORD;
    v_processed INT := 0;
    v_errors INT := 0;
BEGIN
    FOR v_claim IN 
        SELECT id 
        FROM claims 
        WHERE fecha_ocurrencia IS NOT NULL 
        AND (fecha_prescripcion_ordinaria IS NULL OR fecha_prescripcion_extraordinaria IS NULL)
    LOOP
        BEGIN
            PERFORM update_claim_prescription_dates(v_claim.id);
            v_processed := v_processed + 1;
        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            RAISE NOTICE 'Error processing claim %: %', v_claim.id, SQLERRM;
        END;
    END LOOP;
    
    RETURN QUERY SELECT v_processed, v_errors;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION batch_update_prescription_dates() IS 'Actualiza las fechas de prescripción para todos los siniestros que no las tengan calculadas';

-- Trigger function to auto-calculate prescription dates on insert/update
CREATE OR REPLACE FUNCTION trigger_calculate_prescription_dates()
RETURNS TRIGGER AS $$
BEGIN
    -- Only recalculate if fecha_ocurrencia changed or is new
    IF TG_OP = 'INSERT' OR 
       (TG_OP = 'UPDATE' AND NEW.fecha_ocurrencia IS DISTINCT FROM OLD.fecha_ocurrencia) OR
       (TG_OP = 'UPDATE' AND NEW.ramo IS DISTINCT FROM OLD.ramo) THEN
        
        IF NEW.fecha_ocurrencia IS NOT NULL THEN
            SELECT fecha_prescripcion_ordinaria, fecha_prescripcion_extraordinaria
            INTO NEW.fecha_prescripcion_ordinaria, NEW.fecha_prescripcion_extraordinaria
            FROM calculate_prescription_dates(NEW.id);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on claims table
DROP TRIGGER IF EXISTS trigger_claims_prescription_dates ON claims;
CREATE TRIGGER trigger_claims_prescription_dates
    BEFORE INSERT OR UPDATE ON claims
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_prescription_dates();

COMMENT ON FUNCTION trigger_calculate_prescription_dates() IS 'Trigger para calcular automáticamente las fechas de prescripción al insertar o actualizar un siniestro';
