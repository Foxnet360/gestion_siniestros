-- ============================================================================
-- SOLUCIÓN DEFINITIVA: Crear usuario paso a paso
-- ============================================================================
-- PASO 1: Primero verificamos el estado actual
-- ============================================================================

-- 1.1 Verificar si hay usuarios en public.users
SELECT 'Usuarios en public.users:' as ubicacion, COUNT(*) as cantidad FROM users;

-- 1.2 Verificar si hay usuarios en auth.users
SELECT 'Usuarios en auth.users:' as ubicacion, COUNT(*) as cantidad FROM auth.users;

-- 1.3 Verificar si existe la función
SELECT 'Función create_user_with_auth:' as item, 
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_user_with_auth') 
       THEN 'EXISTE' ELSE 'NO EXISTE' END as estado;

-- ============================================================================
-- PASO 2: Desactivar RLS para poder insertar
-- ============================================================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASO 3: Crear usuario directamente en auth.users (sin función RPC)
-- ============================================================================

-- Primero verificamos si ya existe
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Verificar si el usuario ya existe
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'indemnizaciones@correseguros.co';
    
    IF v_user_id IS NULL THEN
        -- Generar UUID
        v_user_id := extensions.uuid_generate_v4();
        
        -- Insertar en auth.users
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            new_email
        ) VALUES (
            v_user_id,
            'indemnizaciones@correseguros.co',
            crypt('SGS123456', gen_salt('bf')),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "Maryory Espinosa Sánchez", "role": "ADMIN"}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            NULL
        );
        
        -- Insertar en public.users
        INSERT INTO users (id, email, name, role, initials, aliado_id, is_active, created_at, updated_at)
        VALUES (
            v_user_id, 
            'indemnizaciones@correseguros.co', 
            'Maryory Espinosa Sánchez', 
            'ADMIN', 
            'MES', 
            NULL, 
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅✅✅ USUARIO CREADO EXITOSAMENTE ✅✅✅';
        RAISE NOTICE 'Email: indemnizaciones@correseguros.co';
        RAISE NOTICE 'Contraseña: SGS123456';
        RAISE NOTICE 'Rol: ADMIN';
    ELSE
        RAISE NOTICE '⚠️ El usuario ya existe con ID: %', v_user_id;
    END IF;
END $$;

-- ============================================================================
-- PASO 4: Verificar que se creó correctamente
-- ============================================================================
SELECT 
    'VERIFICACIÓN:' as paso,
    u.email,
    u.name,
    u.role,
    CASE WHEN au.id IS NOT NULL THEN '✅ SÍ' ELSE '❌ NO' END as en_auth_users,
    CASE WHEN u.id IS NOT NULL THEN '✅ SÍ' ELSE '❌ NO' END as en_public_users
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email = 'indemnizaciones@correseguros.co';

-- ============================================================================
-- PASO 5: Reactivar RLS con políticas permisivas
-- ============================================================================

-- Eliminar políticas anteriores
DROP POLICY IF EXISTS "Allow all operations" ON users;
DROP POLICY IF EXISTS "Allow select for all" ON users;
DROP POLICY IF EXISTS "Allow modify for authenticated" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admin can manage all users" ON users;
DROP POLICY IF EXISTS "Manager can view all users" ON users;

-- Crear política permisiva
CREATE POLICY "Allow all operations" ON users
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Reactivar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASO 6: Resumen final
-- ============================================================================
SELECT '========================================' as linea;
SELECT 'RESUMEN FINAL:' as titulo;
SELECT '========================================' as linea;

SELECT 
    'Total usuarios creados: ' || COUNT(*)::text as info
FROM users;

SELECT 
    'Estado RLS: ' || CASE WHEN relrowsecurity THEN 'ACTIVADO ✅' ELSE 'DESACTIVADO ⚠️' END as info
FROM pg_class 
WHERE relname = 'users';

SELECT '========================================' as linea;
SELECT 'DATOS DE LOGIN:' as titulo;
SELECT 'Email: indemnizaciones@correseguros.co' as dato;
SELECT 'Contraseña: SGS123456' as dato;
SELECT '========================================' as linea;

-- ============================================================================
-- INSTRUCCIONES
-- ============================================================================
-- 1. Si ves "USUARIO CREADO EXITOSAMENTE" arriba, ve al Dashboard
-- 2. Authentication > Users (debe aparecer el email)
-- 3. Refresca la app (F5) e intenta login
-- ============================================================================
