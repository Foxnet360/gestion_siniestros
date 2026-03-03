-- Migration: Add tracking functionality for edit tab with bitacora
-- Created as part of change: edit-tab-bitacora-seguimiento

-- ============================================
-- 1.1 Verify/Create timeline table
-- ============================================
-- The timeline table should already exist with these columns:
-- - id (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
-- - claim_id (UUID/STRING, REFERENCES claims(id_softseguros))
-- - date (TIMESTAMP WITH TIME ZONE)
-- - author (TEXT)
-- - text (TEXT)
-- - isSystem (BOOLEAN, DEFAULT false)

-- Verify table exists:
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'timeline'
);

-- If table doesn't exist, create it:
CREATE TABLE IF NOT EXISTS timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id TEXT NOT NULL REFERENCES claims(id_softseguros),
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    author TEXT NOT NULL,
    text TEXT NOT NULL,
    isSystem BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 1.2 Verify field names in claims table
-- ============================================
-- Check if proximo_seguimiento field exists:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'claims' 
AND column_name IN ('proximo_seguimiento', 'fecha_ultimo_seguimiento', 'lastStateChangeDate');

-- If proximo_seguimiento doesn't exist, add it:
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS proximo_seguimiento TIMESTAMP WITH TIME ZONE;

-- ============================================
-- 1.3 Create RPC function for atomic transaction
-- ============================================
-- This function updates the claim's next follow-up date 
-- and creates a timeline entry in a single transaction

CREATE OR REPLACE FUNCTION update_tracking_with_bitacora(
    p_claim_id TEXT,
    p_proximo_seguimiento TIMESTAMP WITH TIME ZONE,
    p_estado_interno TEXT,
    p_author TEXT,
    p_timeline_text TEXT
) RETURNS VOID AS $$
BEGIN
    -- Update claim with new follow-up date
    UPDATE claims 
    SET 
        proximo_seguimiento = p_proximo_seguimiento,
        estado_interno = p_estado_interno,
        lastStateChangeDate = NOW(),
        updatedAt = NOW()
    WHERE id_softseguros = p_claim_id;
    
    -- Insert timeline entry
    INSERT INTO timeline (claim_id, date, author, text, isSystem)
    VALUES (
        p_claim_id,
        NOW(),
        p_author,
        p_timeline_text,
        true
    );
    
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1.4 Add index on timeline.claim_id
-- ============================================
CREATE INDEX IF NOT EXISTS idx_timeline_claim_id 
ON timeline(claim_id);

-- Also add index on date for sorting
CREATE INDEX IF NOT EXISTS idx_timeline_date 
ON timeline(date DESC);

-- ============================================
-- Verification queries
-- ============================================
-- Check timeline table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'timeline';

-- Check if function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'update_tracking_with_bitacora';

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'timeline';
