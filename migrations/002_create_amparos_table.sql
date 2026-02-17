-- Migration: Create amparos table
-- Date: 2026-02-11
-- Purpose: Store coverage (amparo) details for each claim with intelligent merge support

CREATE TABLE IF NOT EXISTS amparos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id TEXT NOT NULL,
    numero_siniestro TEXT NOT NULL,
    nombre_reclamante TEXT NOT NULL,
    amparo TEXT NOT NULL,
    valor NUMERIC NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Foreign key to claims table with cascade delete
    CONSTRAINT fk_amparos_claim
        FOREIGN KEY (claim_id)
        REFERENCES claims(id_softseguros)
        ON DELETE CASCADE
);

-- Add index on claim_id for efficient lookups
CREATE INDEX IF NOT EXISTS idx_amparos_claim_id ON amparos(claim_id);

-- Add composite index for merge operations (composite key: amparo + nombre_reclamante)
CREATE INDEX IF NOT EXISTS idx_amparos_composite_key ON amparos(claim_id, amparo, nombre_reclamante);

-- Comments for documentation
COMMENT ON TABLE amparos IS 'Coverage (amparo) details for claims, synced from SoftSeguros Excel';
COMMENT ON COLUMN amparos.claim_id IS 'Foreign key to claims.id_softseguros';
COMMENT ON COLUMN amparos.numero_siniestro IS 'Claim number from Excel';
COMMENT ON COLUMN amparos.nombre_reclamante IS 'Claimant name';
COMMENT ON COLUMN amparos.amparo IS 'Coverage type';
COMMENT ON COLUMN amparos.valor IS 'Coverage amount';
