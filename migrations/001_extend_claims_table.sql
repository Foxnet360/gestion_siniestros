-- Migration: Extend claims table with SoftSeguros fields, calculated fields, and internal fields
-- Date: 2026-02-11
-- Purpose: Add 17 new fields to support complete data capture from SoftSeguros Excel

-- Add 14 SoftSeguros-owned fields
ALTER TABLE claims ADD COLUMN IF NOT EXISTS numero_siniestro_compania TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS tipo_siniestro TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS fecha_aviso TIMESTAMP;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS fecha_notificacion_aseguradora TIMESTAMP;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS proveedor_asignado TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS documento_asegurado TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS email_principal TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS celular_principal TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS porcentaje_siniestralidad NUMERIC;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS finalizado BOOLEAN DEFAULT FALSE;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS fecha_finalizacion TIMESTAMP;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS coaseguros NUMERIC;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS gestion_softseguros TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS estado_gestion_softseguros TEXT;

-- Add 2 calculated prescription fields
ALTER TABLE claims ADD COLUMN IF NOT EXISTS prescripcion_ordinaria DATE;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS prescripcion_extraordinaria DATE;

-- Add 1 internal management field
ALTER TABLE claims ADD COLUMN IF NOT EXISTS proximo_seguimiento TIMESTAMP;

-- All columns are nullable for backward compatibility
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
COMMENT ON COLUMN claims.gestion_softseguros IS 'Hybrid: Management notes from Gestión sheet';
COMMENT ON COLUMN claims.estado_gestion_softseguros IS 'Hybrid: Management state from Gestión sheet';
COMMENT ON COLUMN claims.prescripcion_ordinaria IS 'Calculated: fecha_siniestro + 2 years';
COMMENT ON COLUMN claims.prescripcion_extraordinaria IS 'Calculated: fecha_siniestro + 5 years';
COMMENT ON COLUMN claims.proximo_seguimiento IS 'Internal-only: Next follow-up date';
