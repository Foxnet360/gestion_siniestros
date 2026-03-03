-- Verificar y crear tabla timeline si no existe
-- Ejecutar esto primero en Supabase SQL Editor

-- 1. Verificar si la tabla existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'timeline'
);

-- 2. Si NO existe, ejecutar esto para crearla:
CREATE TABLE IF NOT EXISTS timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id TEXT NOT NULL REFERENCES claims(id_softseguros),
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    author TEXT NOT NULL,
    text TEXT NOT NULL,
    isSystem BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Verificar estructura actual (para confirmar columnas)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'timeline';

-- 4. Crear la función RPC (después de confirmar que la tabla existe)
CREATE OR REPLACE FUNCTION update_tracking_with_bitacora(
    p_claim_id TEXT,
    p_proximo_seguimiento TIMESTAMP WITH TIME ZONE,
    p_estado_interno TEXT,
    p_author TEXT,
    p_timeline_text TEXT
) RETURNS VOID AS $$
BEGIN
    -- Actualizar claim
    UPDATE claims 
    SET 
        proximo_seguimiento = p_proximo_seguimiento,
        estado_interno = p_estado_interno,
        updatedAt = NOW()
    WHERE id_softseguros = p_claim_id;
    
    -- Insertar en timeline
    INSERT INTO timeline (claim_id, date, author, text, isSystem)
    VALUES (p_claim_id, NOW(), p_author, p_timeline_text, true);
END;
$$ LANGUAGE plpgsql;

-- 5. Verificar que todo esté correcto
SELECT 'Tabla timeline:' as check_item, count(*) as exists 
FROM information_schema.tables 
WHERE table_name = 'timeline'
UNION ALL
SELECT 'Función RPC:' as check_item, count(*) as exists 
FROM pg_proc 
WHERE proname = 'update_tracking_with_bitacora';
