-- ============================================================================
-- SMART INGESTION MERGE - COMPLETE MIGRATION
-- Apply this in Supabase Dashboard → SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. EXTEND CLAIMS TABLE (14 SoftSeguros + 2 Calculated + 1 Internal)
-- ============================================================================

-- SoftSeguros-owned fields (14 fields)
ALTER TABLE claims ADD COLUMN IF NOT EXISTS numero_siniestro_compania TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS tipo_siniestro TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS fecha_aviso DATE;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS fecha_notificacion_aseguradora DATE;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS proveedor_asignado TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS documento_asegurado TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS email_principal TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS celular_principal TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS porcentaje_siniestralidad NUMERIC;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS finalizado BOOLEAN DEFAULT FALSE;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS fecha_finalizacion DATE;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS coaseguros NUMERIC;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS ultimo_seguimiento_raw TEXT;

-- Hybrid fields (2 fields from Gestión sheet)
ALTER TABLE claims ADD COLUMN IF NOT EXISTS gestion_softseguros TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS estado_gestion_softseguros TEXT;

-- Calculated fields (2 fields)
ALTER TABLE claims ADD COLUMN IF NOT EXISTS prescripcion_ordinaria DATE;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS prescripcion_extraordinaria DATE;

-- Internal management field (1 field)
ALTER TABLE claims ADD COLUMN IF NOT EXISTS proximo_seguimiento TIMESTAMP;

-- Add column comments for documentation
COMMENT ON COLUMN claims.numero_siniestro_compania IS 'SoftSeguros-owned: Company claim number';
COMMENT ON COLUMN claims.tipo_siniestro IS 'SoftSeguros-owned: Type of claim';
COMMENT ON COLUMN claims.fecha_aviso IS 'SoftSeguros-owned: Notice date';
COMMENT ON COLUMN claims.fecha_notificacion_aseguradora IS 'SoftSeguros-owned: Insurer notification date';
COMMENT ON COLUMN claims.proveedor_asignado IS 'SoftSeguros-owned: Assigned provider';
COMMENT ON COLUMN claims.descripcion IS 'SoftSeguros-owned: Claim description';
COMMENT ON COLUMN claims.documento_asegurado IS 'SoftSeguros-owned: Insured document ID';
COMMENT ON COLUMN claims.email_principal IS 'SoftSeguros-owned: Primary email';
COMMENT ON COLUMN claims.celular_principal IS 'SoftSeguros-owned: Primary phone';
COMMENT ON COLUMN claims.porcentaje_siniestralidad IS 'SoftSeguros-owned: Loss ratio percentage';
COMMENT ON COLUMN claims.finalizado IS 'SoftSeguros-owned: Finalized flag';
COMMENT ON COLUMN claims.fecha_finalizacion IS 'SoftSeguros-owned: Finalization date';
COMMENT ON COLUMN claims.coaseguros IS 'SoftSeguros-owned: Coinsurance amount';
COMMENT ON COLUMN claims.ultimo_seguimiento_raw IS 'SoftSeguros-owned: Raw follow-up text';
COMMENT ON COLUMN claims.gestion_softseguros IS 'Hybrid: Management notes from Gestión sheet';
COMMENT ON COLUMN claims.estado_gestion_softseguros IS 'Hybrid: Management state from Gestión sheet';
COMMENT ON COLUMN claims.prescripcion_ordinaria IS 'Calculated: fecha_siniestro + 2 years';
COMMENT ON COLUMN claims.prescripcion_extraordinaria IS 'Calculated: fecha_siniestro + 5 years';
COMMENT ON COLUMN claims.proximo_seguimiento IS 'Internal-only: Next follow-up date';

-- ============================================================================
-- 2. CREATE AMPAROS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS amparos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id TEXT NOT NULL,
    numero_siniestro TEXT NOT NULL,
    nombre_reclamante TEXT NOT NULL,
    amparo TEXT NOT NULL,
    valor NUMERIC NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Foreign key constraint with cascade delete
    CONSTRAINT fk_amparos_claim
        FOREIGN KEY (claim_id)
        REFERENCES claims(id_softseguros)
        ON DELETE CASCADE
);

-- Add table comment
COMMENT ON TABLE amparos IS 'Coverage details for claims, merged using composite key (amparo + nombre_reclamante)';

-- Create indexes for amparos
CREATE INDEX IF NOT EXISTS idx_amparos_claim_id ON amparos(claim_id);
CREATE INDEX IF NOT EXISTS idx_amparos_composite_key ON amparos(claim_id, amparo, nombre_reclamante);

COMMENT ON INDEX idx_amparos_claim_id IS 'Fast lookup of all amparos for a claim';
COMMENT ON INDEX idx_amparos_composite_key IS 'Composite key for merge operations (insert/update/delete detection)';

-- ============================================================================
-- 3. PERFORMANCE INDEXES
-- ============================================================================

-- Claims table indexes
CREATE INDEX IF NOT EXISTS idx_claims_estado_softseguros ON claims(estado_softseguros);
CREATE INDEX IF NOT EXISTS idx_claims_aseguradora ON claims(aseguradora);
CREATE INDEX IF NOT EXISTS idx_claims_tecnico ON claims(tecnico_asignado);

-- State history index
CREATE INDEX IF NOT EXISTS idx_state_history_claim_id ON state_history(claim_id);

-- Timeline index
CREATE INDEX IF NOT EXISTS idx_timeline_claim_id ON timeline(claim_id);

-- Add index comments
COMMENT ON INDEX idx_claims_estado_softseguros IS 'Filter claims by SoftSeguros state';
COMMENT ON INDEX idx_claims_aseguradora IS 'Filter claims by insurer';
COMMENT ON INDEX idx_claims_tecnico IS 'Filter claims by assigned technician';
COMMENT ON INDEX idx_state_history_claim_id IS 'Fast lookup of state history for a claim';
COMMENT ON INDEX idx_timeline_claim_id IS 'Fast lookup of timeline events for a claim';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Run this entire script in Supabase Dashboard → SQL Editor
-- Then refresh your app to see the changes take effect
-- ============================================================================
