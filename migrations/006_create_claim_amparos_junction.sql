-- Migration: Create claim_amparos junction table for many-to-many relationship
-- Date: 2026-03-03
-- Purpose: Link claims with multiple amparos (coverage types)

CREATE TABLE IF NOT EXISTS claim_amparos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id TEXT NOT NULL,
    amparo_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Foreign keys
    CONSTRAINT fk_claim_amparos_claim
        FOREIGN KEY (claim_id)
        REFERENCES claims(id_softseguros)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_claim_amparos_amparo
        FOREIGN KEY (amparo_id)
        REFERENCES amparos(id)
        ON DELETE CASCADE,
    
    -- Prevent duplicate associations
    CONSTRAINT uq_claim_amparos UNIQUE (claim_id, amparo_id)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_claim_amparos_claim_id ON claim_amparos(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_amparos_amparo_id ON claim_amparos(amparo_id);

-- Comments for documentation
COMMENT ON TABLE claim_amparos IS 'Junction table linking claims with their coverage types (amparos)';
COMMENT ON COLUMN claim_amparos.claim_id IS 'Foreign key to claims.id_softseguros';
COMMENT ON COLUMN claim_amparos.amparo_id IS 'Foreign key to amparos.id';
