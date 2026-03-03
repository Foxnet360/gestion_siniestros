-- ============================================================================
-- EMERGENCIA: Crear usuario manualmente paso a paso
-- ============================================================================
-- Este script desactiva temporalmente triggers y crea el usuario directamente
-- ============================================================================

-- PASO 1: Verificar el error exacto
-- Ejecuta esto primero para ver qué error da:

-- Verificar si existe algún trigger problemático en auth.users
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    CASE WHEN tgenabled = 'O' THEN 'ENABLED' ELSE 'DISABLED' END as status
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass
AND tgname NOT LIKE 'pg_%';

-- ============================================================================
-- PASO 2: Desactivar triggers en auth.users (temporalmente)
-- ============================================================================

-- Listar triggers para desactivar
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'auth.users'::regclass 
        AND tgname NOT LIKE 'pg_%'
        AND tgenabled = 'O'
    LOOP
        EXECUTE format('ALTER TABLE auth.users DISABLE TRIGGER %I', trigger_record.tgname);
        RAISE NOTICE 'Trigger desactivado: %', trigger_record.tgname;
    END LOOP;
END $$;

-- ============================================================================
-- PASO 3: Crear usuario directamente con INSERT simple
-- ============================================================================

-- Verificar si ya existe
DO $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM auth.users WHERE email = 'indemnizaciones@correseguros.co';
    
    IF v_count = 0 THEN
        -- Insertar solo lo mínimo necesario
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            created_at,
            updated_at,
            phone,
            phone_confirmed_at,
            phone_change,
            phone_change_token,
            phone_change_sent_at,
            email_change,
            email_change_token_new,
            email_change_sent_at,
            confirmation_token,
            confirmation_sent_at,
            recovery_token,
            new_email
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            'authenticated',
            'authenticated',
            'indemnizaciones@correseguros.co',
            crypt('SGS123456', gen_salt('bf')),
            NOW(),
            NULL,
            NULL,
            '{"provider":"email","providers":["email"]}',
            '{"name":"Maryory Espinosa"}',
            false,
            NOW(),
            NOW(),
            NULL,
            NULL,
            NULL,
            '',
            NULL,
            NULL,
            '',
            NULL,
            '',
            NULL,
            '',
            NULL
        );
        
        RAISE NOTICE '✅ Usuario creado en auth.users';
    ELSE
        RAISE NOTICE '⚠️ Usuario ya existe en auth.users';
    END IF;
END $$;

-- ============================================================================
-- PASO 4: Insertar en public.users
-- ============================================================================

DO $$
DECLARE
    v_user_id UUID;
    v_count INT;
BEGIN
    -- Obtener el ID del usuario creado
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'indemnizaciones@correseguros.co';
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE '❌ ERROR: No se encontró el usuario en auth.users';
        RETURN;
    END IF;
    
    -- Verificar si ya existe en public.users
    SELECT COUNT(*) INTO v_count FROM users WHERE email = 'indemnizaciones@correseguros.co';
    
    IF v_count = 0 THEN
        INSERT INTO users (
            id,
            email,
            name,
            role,
            initials,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            'indemnizaciones@correseguros.co',
            'Maryory Espinosa Sánchez',
            'ADMIN',
            'MES',
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Usuario creado en public.users';
    ELSE
        RAISE NOTICE '⚠️ Usuario ya existe en public.users';
    END IF;
END $$;

-- ============================================================================
-- PASO 5: Reactivar triggers
-- ============================================================================

DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'auth.users'::regclass 
        AND tgname NOT LIKE 'pg_%'
        AND tgenabled = 'D'
    LOOP
        EXECUTE format('ALTER TABLE auth.users ENABLE TRIGGER %I', trigger_record.tgname);
        RAISE NOTICE 'Trigger reactivado: %', trigger_record.tgname;
    END LOOP;
END $$;

-- ============================================================================
-- PASO 6: Verificación final
-- ============================================================================

SELECT 
    'VERIFICACIÓN:' as titulo,
    u.email,
    u.name,
    u.role,
    CASE WHEN au.id IS NOT NULL THEN '✅ OK' ELSE '❌ FALTA' END as auth_users,
    CASE WHEN u.id IS NOT NULL THEN '✅ OK' ELSE '❌ FALTA' END as public_users
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email = 'indemnizaciones@correseguros.co';

-- ============================================================================
-- ALTERNATIVA NUCLEAR (si todo falla)
-- ============================================================================
/*
Si el script anterior no funciona, ejecuta esto para desactivar TODOS los triggers:

-- Desactivar TODOS los triggers del sistema (¡CUIDADO!)
SET session_replication_role = 'replica';

-- Insertar usuario
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'indemnizaciones@correseguros.co',
    crypt('SGS123456', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
);

INSERT INTO users (id, email, name, role, initials, is_active)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'indemnizaciones@correseguros.co',
    'Maryory Espinosa Sánchez',
    'ADMIN',
    'MES',
    true
);

-- Reactivar triggers
SET session_replication_role = 'origin';

Luego verifica que el usuario exista.
*/
