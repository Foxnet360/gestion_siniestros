-- ============================================================================
-- EMERGENCIA: Script completo para hacer funcionar el login
-- ============================================================================
-- EJECUTAR ESTO EN SQL EDITOR DE SUPABASE
-- ============================================================================

-- PASO 1: Desactivar RLS completamente (temporal)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY; -- Esto no se puede hacer, ignorar error

-- PASO 2: Verificar si existe la función
SELECT 'Verificando función...' as paso;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_user_with_auth') THEN
        -- Crear la función si no existe
        CREATE OR REPLACE FUNCTION create_user_with_auth(
            p_email VARCHAR,
            p_password VARCHAR,
            p_name VARCHAR,
            p_role VARCHAR,
            p_initials VARCHAR,
            p_aliado_id VARCHAR DEFAULT NULL
        )
        RETURNS UUID AS $$
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
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        
        RAISE NOTICE 'Función create_user_with_auth CREADA';
    ELSE
        RAISE NOTICE 'Función create_user_with_auth YA EXISTE';
    END IF;
END $$;

-- PASO 3: Crear al menos un usuario ADMIN de emergencia
-- Maryory Espinosa - ADMIN
DO $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM users WHERE email = 'indemnizaciones@correseguros.co') INTO v_exists;
    
    IF NOT v_exists THEN
        PERFORM create_user_with_auth(
            'indemnizaciones@correseguros.co',
            'SGS123456',
            'Maryory Espinosa Sánchez',
            'ADMIN',
            'MES'
        );
        RAISE NOTICE 'Usuario creado: Maryory Espinosa Sánchez (ADMIN)';
    ELSE
        RAISE NOTICE 'Usuario ya existe: indemnizaciones@correseguros.co';
    END IF;
END $$;

-- PASO 4: Verificar que el usuario existe
SELECT 'Verificando usuario creado...' as paso;

SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.initials,
    u.is_active,
    CASE WHEN au.id IS NOT NULL THEN 'SÍ' ELSE 'NO' END as existe_en_auth_users
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email = 'indemnizaciones@correseguros.co';

-- PASO 5: Configurar políticas RLS PERMISIVAS
SELECT 'Configurando RLS...' as paso;

-- Eliminar todas las políticas anteriores
DROP POLICY IF EXISTS "Users can view and edit own profile" ON users;
DROP POLICY IF EXISTS "Admin can manage all users" ON users;
DROP POLICY IF EXISTS "Manager can view all users" ON users;
DROP POLICY IF EXISTS "Allow select for all" ON users;
DROP POLICY IF EXISTS "Allow modify for authenticated" ON users;

-- Crear política PERMISIVA (permitir todo temporalmente)
CREATE POLICY "Allow all operations" ON users
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- PASO 6: Reactivar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- PASO 7: Verificar estado final
SELECT 'Estado final:' as info;
SELECT 
    'RLS activado: ' || CASE WHEN relrowsecurity THEN 'SÍ' ELSE 'NO' END as estado
FROM pg_class WHERE relname = 'users';

SELECT 
    'Políticas: ' || COUNT(*)::text as cantidad
FROM pg_policies WHERE tablename = 'users';

SELECT 
    'Total usuarios: ' || COUNT(*)::text as total
FROM users;

-- PASO 8: Probar login
SELECT 'PROBANDO LOGIN...' as paso;

-- Verificar credenciales
SELECT 
    'Email existe: ' || CASE WHEN EXISTS(SELECT 1 FROM users WHERE email = 'indemnizaciones@correseguros.co') THEN 'SÍ ✓' ELSE 'NO ✗' END as verificacion
UNION ALL
SELECT 
    'En auth.users: ' || CASE WHEN EXISTS(SELECT 1 FROM auth.users WHERE email = 'indemnizaciones@correseguros.co') THEN 'SÍ ✓' ELSE 'NO ✗' END
UNION ALL
SELECT 
    'Contraseña hash existe: ' || CASE 
        WHEN EXISTS(SELECT 1 FROM auth.users WHERE email = 'indemnizaciones@correseguros.co' AND encrypted_password IS NOT NULL) 
        THEN 'SÍ ✓' 
        ELSE 'NO ✗' 
    END;

-- ============================================================================
-- INSTRUCCIONES FINALES
-- ============================================================================
/*
✅ Si todo salió bien:
   - El usuario "indemnizaciones@correseguros.co" con contraseña "SGS123456" está creado
   - Puedes iniciar sesión en la app
   
🔧 Si sigue sin funcionar:
   1. Ve a Supabase Dashboard > Authentication > Users
   2. Verifica que aparezca "indemnizaciones@correseguros.co"
   3. Si no aparece, copia este script completo y ejecútalo de nuevo
   4. Refresca la app (F5) e intenta login
   
⚠️ IMPORTANTE: Las políticas RLS están ahora PERMISIVAS (permiten todo).
   Para producción, deberías ajustarlas después de verificar que todo funciona.
*/
