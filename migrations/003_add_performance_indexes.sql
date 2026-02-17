-- Migration: Add performance indexes for merge operations
-- Date: 2026-02-11
-- Purpose: Optimize query performance for smart merge ingestion

-- Indexes on claims table for filtering and lookups
CREATE INDEX IF NOT EXISTS idx_claims_estado_softseguros ON claims(estado_softseguros);
CREATE INDEX IF NOT EXISTS idx_claims_aseguradora ON claims(aseguradora);
CREATE INDEX IF NOT EXISTS idx_claims_tecnico ON claims(tecnico);

-- Indexes on state_history table for efficient claim history queries
CREATE INDEX IF NOT EXISTS idx_state_history_claim_id ON state_history(claim_id);

-- Indexes on timeline table for efficient claim timeline queries
CREATE INDEX IF NOT EXISTS idx_timeline_claim_id ON timeline(claim_id);

-- Note: idx_amparos_claim_id is already created in 002_create_amparos_table.sql

-- Comments for documentation
COMMENT ON INDEX idx_claims_estado_softseguros IS 'Optimize filtering by SoftSeguros state';
COMMENT ON INDEX idx_claims_aseguradora IS 'Optimize filtering by insurer';
COMMENT ON INDEX idx_claims_tecnico IS 'Optimize filtering by assigned technician';
COMMENT ON INDEX idx_state_history_claim_id IS 'Optimize state history lookups by claim';
COMMENT ON INDEX idx_timeline_claim_id IS 'Optimize timeline lookups by claim';
