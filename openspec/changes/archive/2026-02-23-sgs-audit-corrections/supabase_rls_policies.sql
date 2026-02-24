-- ============================================================================
-- SGS AUDIT CORRECTIONS - RLS POLICIES FOR ALIADO ROLE
-- ============================================================================

-- Enable RLS on claims table
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY 1: Aliado users can only view claims where aliado_origen matches
-- ============================================================================
CREATE POLICY "Aliado users can view own claims" 
ON claims 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'ALIADO'
    AND claims.aliado_origen = auth.users.raw_user_meta_data->>'aliadoId'
  )
);

-- ============================================================================
-- POLICY 2: Admin and Tecnico roles can view all claims (bypass)
-- ============================================================================
CREATE POLICY "Admin and Tecnico can view all claims" 
ON claims 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (auth.users.raw_user_meta_data->>'role' = 'ADMIN' 
         OR auth.users.raw_user_meta_data->>'role' = 'TECNICO')
  )
);

-- ============================================================================
-- POLICY 3: Admin can update all claims
-- ============================================================================
CREATE POLICY "Admin can update all claims" 
ON claims 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'ADMIN'
  )
);

-- ============================================================================
-- POLICY 4: Aliado users cannot update claims (read-only)
-- ============================================================================
CREATE POLICY "Aliado users cannot update claims" 
ON claims 
FOR UPDATE 
USING (false);

-- ============================================================================
-- DATABASE SCHEMA UPDATES
-- ============================================================================

-- Add numero_siniestro_compania column if not exists
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS numero_siniestro_compania VARCHAR(255);

-- Create index for faster search on numero_siniestro_compania
CREATE INDEX IF NOT EXISTS idx_claims_numero_siniestro_compania 
ON claims(numero_siniestro_compania);

-- Add aliado_origen column if not exists
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS aliado_origen VARCHAR(255);

-- Create index for RLS performance
CREATE INDEX IF NOT EXISTS idx_claims_aliado_origen 
ON claims(aliado_origen);

-- ============================================================================
-- NOTES FOR DEPLOYMENT
-- ============================================================================

-- 1. Ensure user metadata includes:
--    - role: 'ADMIN' | 'TECNICO' | 'ALIADO'
--    - aliadoId: string (required for ALIADO role)

-- 2. Test queries:
--    SELECT * FROM claims; -- Should return only matching claims for ALIADO

-- 3. To verify RLS is working:
--    SET ROLE authenticated;
--    SET request.jwt.claim.sub = 'user-uuid-here';
--    SELECT * FROM claims;
