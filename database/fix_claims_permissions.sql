-- Verificar y corregir permisos de tabla claims
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar columnas necesarias
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'claims' 
AND column_name IN ('estado_interno', 'proximo_seguimiento', 'finalizado', 'fecha_finalizacion', 'updatedAt')
ORDER BY ordinal_position;

-- 2. Verificar si RLS está habilitado
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'claims';

-- 3. Verificar políticas existentes
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'claims';

-- 4. Si RLS está habilitado pero no hay políticas o las políticas son restrictivas,
-- crear política permisiva para desarrollo

-- Deshabilitar RLS temporalmente para pruebas (solo en desarrollo)
-- ALTER TABLE claims DISABLE ROW LEVEL SECURITY;

-- O crear política permisiva
DROP POLICY IF EXISTS "Allow all operations on claims" ON claims;
CREATE POLICY "Allow all operations on claims" ON claims
    FOR ALL
    TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- 5. Verificar permisos del usuario
SELECT grantee, privilege_type 
FROM information_schema.table_privileges 
WHERE table_name = 'claims';

-- 6. Otorgar todos los permisos si es necesario
GRANT ALL ON claims TO authenticated;
GRANT ALL ON claims TO anon;

-- 7. Verificación final
SELECT 'RLS Habilitado:' as check_item, relrowsecurity as status
FROM pg_class 
WHERE relname = 'claims'
UNION ALL
SELECT 'Políticas activas:' as check_item, count(*)::boolean as status
FROM pg_policies 
WHERE tablename = 'claims';
