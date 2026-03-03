-- ============================================================================
-- FIX V3: Diagnóstico y Solución Completa para RLS + Usuarios
-- ============================================================================

-- ============================================================================
-- PARTE 1: DESACTIVAR RLS TEMPORALMENTE PARA DIAGNÓSTICO
-- ============================================================================

-- Desactivar RLS temporalmente para poder verificar datos
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PARTE 2: VERIFICAR SI EXISTEN USUARIOS
-- ============================================================================

-- Verificar usuarios en public.users
SELECT 'Usuarios en public.users:' as info, COUNT(*) as total FROM users;

-- Verificar usuarios en auth.users
SELECT 'Usuarios en auth.users:' as info, COUNT(*) as total FROM auth.users;

-- Verificar función RPC
SELECT 'Función create_user_with_auth:' as info, 
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_user_with_auth') 
       THEN 'EXISTE' ELSE 'NO EXISTE' END as estado;

-- Mostrar usuarios existentes (si hay)
SELECT id, email, name, role, is_active FROM users LIMIT 10;

-- ============================================================================
-- PARTE 3: POLÍTICAS RLS CORREGIDAS (MÁS PERMISIVAS)
-- ============================================================================

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Users can view and edit own profile" ON users;
DROP POLICY IF EXISTS "Admin can manage all users" ON users;
DROP POLICY IF EXISTS "Manager can view all users" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Allow public read of active users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Crear política: Permitir SELECT a todos (anónimo y autenticado)
-- Esto es necesario porque la app carga usuarios antes del login
CREATE POLICY "Allow select for all" ON users
    FOR SELECT
    USING (true);

-- Crear política: Solo usuarios autenticados pueden INSERT/UPDATE/DELETE
CREATE POLICY "Allow modify for authenticated" ON users
    FOR ALL
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- PARTE 4: REACTIVAR RLS CON NUEVAS POLÍTICAS
-- ============================================================================

-- Reactivar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Forzar recarga de políticas
ALTER TABLE users FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- PARTE 5: VERIFICAR POLÍTICAS CREADAS
-- ============================================================================

SELECT 
    policyname, 
    permissive,
    cmd,
    CASE WHEN qual::text = 'true' THEN 'true (permissive)'
         ELSE 'condicional' END as using_clause_type
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- ============================================================================
-- PARTE 6: INSTRUCCIONES PARA CREAR USUARIOS MANUALMENTE
-- ============================================================================

/*
Si los usuarios NO existen, ejecuta este script para crear uno de prueba:

-- Crear usuario de prueba manualmente (reemplaza los valores)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := extensions.uuid_generate_v4();
    
    -- Insertar en auth.users
    INSERT INTO auth.users (
        id, email, encrypted_password, email_confirmed_at, 
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
        v_user_id,
        'indemnizaciones@correseguros.co',
        crypt('SGS123456', gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"name": "Maryory Espinosa", "role": "ADMIN"}',
        NOW(),
        NOW()
    );
    
    -- Insertar en public.users
    INSERT INTO users (id, email, name, role, initials, is_active)
    VALUES (v_user_id, 'indemnizaciones@correseguros.co', 'Maryory Espinosa', 'ADMIN', 'MES', true);
    
    RAISE NOTICE 'Usuario creado: Maryory Espinosa (ADMIN)';
END $$;
*/

-- ============================================================================
-- RESUMEN
-- ============================================================================

SELECT '=== RESUMEN ===' as mensaje;
SELECT 'RLS Status:' as info, 
       CASE WHEN relrowsecurity THEN 'ACTIVADO' ELSE 'DESACTIVADO' END as estado
FROM pg_class 
WHERE relname = 'users';

SELECT 'Total políticas:' as info, COUNT(*) as cantidad 
FROM pg_policies 
WHERE tablename = 'users';
