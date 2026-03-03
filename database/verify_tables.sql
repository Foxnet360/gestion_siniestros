-- Script para verificar y corregir estructura de tablas
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- 1. Verificar estructura de tabla claims
-- ============================================
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'claims'
ORDER BY ordinal_position;

-- Verificar si existe proximo_seguimiento
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'claims' AND column_name = 'proximo_seguimiento'
) as has_proximo_seguimiento;

-- ============================================
-- 2. Verificar estructura de tabla timeline
-- ============================================
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'timeline'
ORDER BY ordinal_position;

-- Verificar si la tabla existe
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'timeline'
) as timeline_exists;

-- ============================================
-- 3. Crear tabla timeline si no existe
-- ============================================
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
-- 4. Agregar columna proximo_seguimiento si no existe
-- ============================================
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS proximo_seguimiento TIMESTAMP WITH TIME ZONE;

-- ============================================
-- 5. Políticas RLS (Row Level Security)
-- ============================================

-- Verificar si RLS está habilitado en timeline
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'timeline';

-- Habilitar RLS en timeline
ALTER TABLE timeline ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir todas las operaciones (ajustar según necesidad)
DROP POLICY IF EXISTS "Allow all operations" ON timeline;
CREATE POLICY "Allow all operations" ON timeline
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- 6. Verificación final
-- ============================================
SELECT 'claims tiene proximo_seguimiento:' as verificacion,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'claims' AND column_name = 'proximo_seguimiento'
    ) as ok
UNION ALL
SELECT 'timeline existe:' as verificacion,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'timeline'
    ) as ok
UNION ALL
SELECT 'timeline tiene RLS:' as verificacion,
    EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'timeline' AND relrowsecurity = true
    ) as ok;
