-- Migration: Add indexes for siniestro_etapas table
-- Date: 2026-03-03
-- Purpose: Optimize queries for KPI calculations and date filtering

-- Index on claim_id for efficient joins
CREATE INDEX IF NOT EXISTS idx_siniestro_etapas_claim_id 
    ON siniestro_etapas(claim_id);

-- Indexes for stage date queries (used in KPI calculations)
CREATE INDEX IF NOT EXISTS idx_siniestro_etapas_etapa_1 ON siniestro_etapas(etapa_1_fecha) WHERE etapa_1_fecha IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_siniestro_etapas_etapa_2 ON siniestro_etapas(etapa_2_fecha) WHERE etapa_2_fecha IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_siniestro_etapas_etapa_3 ON siniestro_etapas(etapa_3_fecha) WHERE etapa_3_fecha IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_siniestro_etapas_etapa_4 ON siniestro_etapas(etapa_4_fecha) WHERE etapa_4_fecha IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_siniestro_etapas_etapa_5 ON siniestro_etapas(etapa_5_fecha) WHERE etapa_5_fecha IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_siniestro_etapas_etapa_6 ON siniestro_etapas(etapa_6_fecha) WHERE etapa_6_fecha IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_siniestro_etapas_etapa_7 ON siniestro_etapas(etapa_7_fecha) WHERE etapa_7_fecha IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_siniestro_etapas_etapa_8 ON siniestro_etapas(etapa_8_fecha) WHERE etapa_8_fecha IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_siniestro_etapas_etapa_9 ON siniestro_etapas(etapa_9_fecha) WHERE etapa_9_fecha IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_siniestro_etapas_etapa_10 ON siniestro_etapas(etapa_10_fecha) WHERE etapa_10_fecha IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_siniestro_etapas_etapa_11 ON siniestro_etapas(etapa_11_fecha) WHERE etapa_11_fecha IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_siniestro_etapas_etapa_12 ON siniestro_etapas(etapa_12_fecha) WHERE etapa_12_fecha IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_siniestro_etapas_etapa_13 ON siniestro_etapas(etapa_13_fecha) WHERE etapa_13_fecha IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_siniestro_etapas_etapa_14 ON siniestro_etapas(etapa_14_fecha) WHERE etapa_14_fecha IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_siniestro_etapas_etapa_15 ON siniestro_etapas(etapa_15_fecha) WHERE etapa_15_fecha IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_siniestro_etapas_etapa_16 ON siniestro_etapas(etapa_16_fecha) WHERE etapa_16_fecha IS NOT NULL;

-- Composite indexes for common KPI queries
CREATE INDEX IF NOT EXISTS idx_siniestro_etapas_active 
    ON siniestro_etapas(is_active) 
    WHERE is_active = TRUE;

-- Index for lead time calculation (etapa_16 - etapa_1)
CREATE INDEX IF NOT EXISTS idx_siniestro_etapas_lead_time 
    ON siniestro_etapas(etapa_1_fecha, etapa_16_fecha) 
    WHERE etapa_1_fecha IS NOT NULL AND etapa_16_fecha IS NOT NULL;
