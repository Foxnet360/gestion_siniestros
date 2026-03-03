-- ============================================================================
-- EMERGENCIA V2: Script simplificado para crear usuario y arreglar login
-- ============================================================================
-- IMPORTANTE: Ejecutar TODO el script de una vez
-- ============================================================================

-- ============================================================================
-- PARTE 1: Desactivar RLS temporalmente
-- ============================================================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PARTE 2: Crear función RPC (si no existe)
-- ============================================================================
CREATE OR REPLACE FUNCTION create_user_with_auth(
    p_email VARCHAR,
    p_password VARCHAR,
    p_name VARCHAR,
    p_role VARCHAR,
    p_initials VARCHAR,
    p_aliado_id VARCHAR DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := extensions.uuid_generate_v4();
    
    INSERT INTO auth.users (
        id, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
        v_user_id, p_email, crypt(p_password, gen_salt('bf')), NOW(),
        '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object('name', p_name, 'role', p_role),
        NOW(), NOW()
    );
    
    INSERT INTO users (id, email, name, role, initials, aliado_id, is_active)
    VALUES (v_user_id, p_email, p_name, p_role, p_initials, p_aliado_id, true);
    
    RETURN v_user_id;
END;
$$;

-- ============================================================================
-- PARTE 3: Crear usuario de prueba (Maryory - ADMIN)
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'indemnizaciones@correseguros.co') THEN
        PERFORM create_user_with_auth(
            'indemnizaciones@correseguros.co',
            'SGS123456',
            'Maryory Espinosa Sánchez',
            'ADMIN',
            'MES'
        );
        RAISE NOTICE '✅ Usuario creado: Maryory Espinosa Sánchez (ADMIN)';
    ELSE
        RAISE NOTICE '⚠️ Usuario ya existe: indemnizaciones@correseguros.co';
    END IF;
END $$;

-- ============================================================================
-- PARTE 4: Verificar que el usuario existe
-- ============================================================================
SELECT 
    'USUARIO CREADO:' as info,
    u.email,
    u.name,
    u.role,
    CASE WHEN au.id IS NOT NULL THEN '✅ OK' ELSE '❌ FALTA en auth.users' END as auth_status
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email = 'indemnizaciones@correseguros.co';

-- ============================================================================
-- PARTE 5: Configurar políticas RLS permisivas
-- ============================================================================
DROP POLICY IF EXISTS "Allow all operations" ON users;
DROP POLICY IF EXISTS "Allow select for all" ON users;
DROP POLICY IF EXISTS "Allow modify for authenticated" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Política permisiva temporal
CREATE POLICY "Allow all operations" ON users
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- PARTE 6: Reactivar RLS
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PARTE 7: Resumen
-- ============================================================================
SELECT 'CONFIGURACIÓN COMPLETADA:' as titulo;

SELECT 
    'Total usuarios en sistema: ' || COUNT(*)::text as resumen
FROM users;

SELECT 
    'Estado RLS: ' || CASE WHEN relrowsecurity THEN 'ACTIVADO ✅' ELSE 'DESACTIVADO ⚠️' END as estado
FROM pg_class 
WHERE relname = 'users';

-- ============================================================================
-- INSTRUCCIONES
-- ============================================================================
-- ✅ Si ves el usuario "Maryory Espinosa Sánchez" arriba, todo está listo
-- 🔄 Refresca la app (F5) e intenta login con:
--    Email: indemnizaciones@correseguros.co
--    Contraseña: SGS123456
-- 
-- Si NO funciona, verifica en Supabase Dashboard:
-- Authentication > Users (debe aparecer el email)
