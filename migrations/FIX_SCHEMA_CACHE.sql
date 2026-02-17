-- ============================================================================
-- SCHEMA CACHE REFRESH + ADD MISSING COLUMNS
-- Run this in Supabase SQL Editor to fix the schema mismatch
-- ============================================================================

-- First, let's see what columns actually exist
-- (This is just for reference, comment out after checking)
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'claims' 
-- ORDER BY ordinal_position;

-- ============================================================================
-- Add any missing columns that the code expects
-- ============================================================================

-- Add id_interno if it doesn't exist (used in ClaimsContext)
ALTER TABLE claims ADD COLUMN IF NOT EXISTS id_interno TEXT;

-- Add any other columns that might be missing
ALTER TABLE claims ADD COLUMN IF NOT EXISTS numero_siniestro TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS poliza TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS asegurado TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS estado_softseguros TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS estado_interno TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS usuario_registro TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS placa_bien TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS ramo TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS aseguradora TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS vendedor TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS tecnico_asignado TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS aliado_origen TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS prioridad TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS monto_reclamo NUMERIC;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS valor_deducible NUMERIC;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS valor_indemnizacion NUMERIC;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS fecha_ocurrencia TIMESTAMP;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS lastStateChangeDate TIMESTAMP;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT NOW();

-- Add the 17 new fields from Smart Ingestion
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
ALTER TABLE claims ADD COLUMN IF NOT EXISTS gestion_softseguros TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS estado_gestion_softseguros TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS prescripcion_ordinaria DATE;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS prescripcion_extraordinaria DATE;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS proximo_seguimiento TIMESTAMP;

-- ============================================================================
-- CRITICAL: Refresh Supabase schema cache
-- ============================================================================

-- This forces Supabase to reload the schema cache
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- Verify the columns exist
-- ============================================================================

-- Run this query to verify all columns are now present:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'claims' 
ORDER BY ordinal_position;

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- 1. Run this entire script in Supabase SQL Editor
-- 2. Wait 5-10 seconds for the schema cache to refresh
-- 3. Hard refresh your app (Ctrl+Shift+R)
-- 4. The 400 errors should be gone
-- ============================================================================
