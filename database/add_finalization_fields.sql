-- Script para verificar y agregar campos de finalización
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- Verificar si existen columnas finalizado y fecha_finalizacion
-- ============================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'claims' 
AND column_name IN ('finalizado', 'fecha_finalizacion');

-- ============================================
-- Agregar columna finalizado si no existe
-- ============================================
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS finalizado BOOLEAN DEFAULT false;

-- ============================================
-- Agregar columna fecha_finalizacion si no existe
-- ============================================
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS fecha_finalizacion TIMESTAMP WITH TIME ZONE;

-- ============================================
-- Verificación final
-- ============================================
SELECT 
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'claims' AND column_name = 'finalizado') as has_finalizado,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'claims' AND column_name = 'fecha_finalizacion') as has_fecha_finalizacion;
