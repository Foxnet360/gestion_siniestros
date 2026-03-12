-- Migration: Create siniestro_etapas table for SLA tracking
-- Date: 2026-03-03
-- Purpose: Store extracted stage dates from observations for KPI calculation

CREATE TABLE IF NOT EXISTS siniestro_etapas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id TEXT NOT NULL,
    
    -- Stage dates (1-16)
    etapa_1_fecha DATE,  -- Aviso Siniestro (from fecha_aviso)
    etapa_2_fecha DATE,  -- Radicación Compañía (from fecha_notificacion_aseguradora)
    etapa_3_fecha DATE,  -- Ajustador
    etapa_4_fecha DATE,  -- Documentos Adicionales
    etapa_5_fecha DATE,  -- Asistencia
    etapa_6_fecha DATE,  -- Liquidación
    etapa_7_fecha DATE,  -- Objeción
    etapa_8_fecha DATE,  -- Reconsideración Liquidación
    etapa_9_fecha DATE,  -- Reconsideración Objeción
    etapa_10_fecha DATE, -- Desistimiento
    etapa_11_fecha DATE, -- Ratificación Liquidación
    etapa_12_fecha DATE, -- Ratificación Objeción
    etapa_13_fecha DATE, -- Prescripción
    etapa_14_fecha DATE, -- Proceso Jurídico
    etapa_15_fecha DATE, -- Finalizado
    etapa_16_fecha DATE, -- Pagado
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    extraction_errors TEXT[], -- Log of unparseable observations
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Foreign key to claims table
    CONSTRAINT fk_siniestro_etapas_claim
        FOREIGN KEY (claim_id)
        REFERENCES claims(id_softseguros)
        ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicates
    CONSTRAINT uq_siniestro_etapas_claim_id 
        UNIQUE (claim_id)
);

-- Comments for documentation
COMMENT ON TABLE siniestro_etapas IS 'Stage dates extracted from observations for SLA tracking and KPI calculation';
COMMENT ON COLUMN siniestro_etapas.claim_id IS 'Foreign key to claims.id_softseguros';
COMMENT ON COLUMN siniestro_etapas.etapa_1_fecha IS 'Aviso Siniestro - from fecha_aviso field';
COMMENT ON COLUMN siniestro_etapas.etapa_2_fecha IS 'Radicación Compañía - from fecha_notificacion_aseguradora field';
COMMENT ON COLUMN siniestro_etapas.etapa_3_fecha IS 'Ajustador - extracted from observations';
COMMENT ON COLUMN siniestro_etapas.etapa_4_fecha IS 'Documentos Adicionales - extracted from observations';
COMMENT ON COLUMN siniestro_etapas.etapa_5_fecha IS 'Asistencia - extracted from observations';
COMMENT ON COLUMN siniestro_etapas.etapa_6_fecha IS 'Liquidación - extracted from observations';
COMMENT ON COLUMN siniestro_etapas.etapa_7_fecha IS 'Objeción - extracted from observations';
COMMENT ON COLUMN siniestro_etapas.etapa_8_fecha IS 'Reconsideración Liquidación - extracted from observations';
COMMENT ON COLUMN siniestro_etapas.etapa_9_fecha IS 'Reconsideración Objeción - extracted from observations';
COMMENT ON COLUMN siniestro_etapas.etapa_10_fecha IS 'Desistimiento - extracted from observations';
COMMENT ON COLUMN siniestro_etapas.etapa_11_fecha IS 'Ratificación Liquidación - extracted from observations';
COMMENT ON COLUMN siniestro_etapas.etapa_12_fecha IS 'Ratificación Objeción - extracted from observations';
COMMENT ON COLUMN siniestro_etapas.etapa_13_fecha IS 'Prescripción - extracted from observations';
COMMENT ON COLUMN siniestro_etapas.etapa_14_fecha IS 'Proceso Jurídico - extracted from observations';
COMMENT ON COLUMN siniestro_etapas.etapa_15_fecha IS 'Finalizado - extracted from observations';
COMMENT ON COLUMN siniestro_etapas.etapa_16_fecha IS 'Pagado - extracted from observations';
COMMENT ON COLUMN siniestro_etapas.extraction_errors IS 'Array of errors during observation parsing';
