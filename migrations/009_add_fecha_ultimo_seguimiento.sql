-- Migration: Add fecha_ultimo_seguimiento column to claims table
-- Purpose: Store extracted last follow-up dates from ultimo_seguimiento_raw

ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS fecha_ultimo_seguimiento DATE;

-- Add comment for documentation
COMMENT ON COLUMN claims.fecha_ultimo_seguimiento IS 'Extracted last follow-up date from ultimo_seguimiento_raw field';
