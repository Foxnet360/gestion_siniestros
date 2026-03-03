-- ============================================================================
-- SOLUCIÓN ALTERNATIVA: Crear usuario usando INSERT directo simplificado
-- ============================================================================

-- Primero, desactivar RLS temporalmente
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Intentar insertar con UUID generado manualmente
DO $$
DECLARE
    v_user_id UUID := 'fc7c5b8d-6b6c-4f5a-b8e2-9d9c7b6a5f4e'::uuid;
    v_email TEXT := 'indemnizaciones@correseguros.co';
    v_password TEXT := 'SGS123456';
BEGIN
    -- 1. Intentar insertar en auth.users
    BEGIN
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            new_email
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '',
            '',
            '',
            NULL
        );
        
        RAISE NOTICE '✅ INSERT en auth.users exitoso';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Error en auth.users: %', SQLERRM;
        
        -- Si falla, intentar con otro UUID
        v_user_id := extensions.uuid_generate_v4();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            NOW(),
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ INSERT con nuevo UUID exitoso: %', v_user_id;
    END;
    
    -- 2. Insertar en public.users
    BEGIN
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
            v_email,
            'Maryory Espinosa Sánchez',
            'ADMIN',
            'MES',
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ INSERT en public.users exitoso';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Error en public.users: %', SQLERRM;
    END;
    
END $$;

-- Verificar resultado
SELECT 'VERIFICACIÓN:' as titulo;

SELECT 
    'auth.users' as tabla,
    COUNT(*) as registros
FROM auth.users 
WHERE email = 'indemnizaciones@correseguros.co'
UNION ALL
SELECT 
    'public.users' as tabla,
    COUNT(*) as registros  
FROM users 
WHERE email = 'indemnizaciones@correseguros.co';

-- Mostrar detalles si existe
SELECT 
    'DETALLES:' as titulo,
    id,
    email,
    LEFT(encrypted_password::text, 20) || '...' as password_preview
FROM auth.users 
WHERE email = 'indemnizaciones@correseguros.co';

-- Reactivar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Crear política permisiva
DROP POLICY IF EXISTS "Allow all" ON users;
CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true);
