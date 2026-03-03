-- ============================================================================
-- CREAR USUARIOS DE PRODUCCIÓN - SGS
-- Versión: 2.0 - Compatible con schema completo
-- Fecha: 2026-03-02
-- ============================================================================

-- Desactivar RLS temporalmente para asegurar inserción
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE auth.users DISABLE TRIGGER ALL;

-- ============================================================================
-- USUARIOS ADMIN (2)
-- ============================================================================

-- 1. Maryory Espinosa Sánchez
DO $$
DECLARE
    v_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::UUID;
BEGIN
    -- Insertar en auth.users si no existe
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
        v_id,
        '00000000-0000-0000-0000-000000000000',
        'indemnizaciones@correseguros.co',
        crypt('SGS123456', gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"name":"Maryory Espinosa Sánchez","role":"ADMIN"}',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO NOTHING;
    
    -- Insertar en public.users si no existe
    INSERT INTO users (id, email, name, role, initials, is_active)
    VALUES (v_id, 'indemnizaciones@correseguros.co', 'Maryory Espinosa Sánchez', 'ADMIN', 'MES', true)
    ON CONFLICT (email) DO NOTHING;
    
    RAISE NOTICE 'Usuario 1/13: Maryory Espinosa Sánchez (ADMIN)';
END $$;

-- 2. Alejandro Cardona
DO $$
DECLARE
    v_id UUID := 'b2c3d4e5-f6a7-8901-bcde-f23456789012'::UUID;
BEGIN
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
        v_id,
        '00000000-0000-0000-0000-000000000000',
        'info@correseguros.co',
        crypt('SGS123456', gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"name":"Alejandro Cardona","role":"ADMIN"}',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO NOTHING;
    
    INSERT INTO users (id, email, name, role, initials, is_active)
    VALUES (v_id, 'info@correseguros.co', 'Alejandro Cardona', 'ADMIN', 'AC', true)
    ON CONFLICT (email) DO NOTHING;
    
    RAISE NOTICE 'Usuario 2/13: Alejandro Cardona (ADMIN)';
END $$;

-- ============================================================================
-- USUARIOS TECNICO (4)
-- ============================================================================

-- 3. Sara Lucía Bedoya Velásquez
DO $$
DECLARE
    v_id UUID := 'c3d4e5f6-a7b8-9012-cdef-345678901234'::UUID;
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'indemnizaciones1@correseguros.co', crypt('SGS123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Sara Lucía Bedoya Velásquez","role":"TECNICO"}', NOW(), NOW())
    ON CONFLICT (email) DO NOTHING;
    
    INSERT INTO users (id, email, name, role, initials, is_active)
    VALUES (v_id, 'indemnizaciones1@correseguros.co', 'Sara Lucía Bedoya Velásquez', 'TECNICO', 'SLBV', true)
    ON CONFLICT (email) DO NOTHING;
    
    RAISE NOTICE 'Usuario 3/13: Sara Lucía Bedoya Velásquez (TECNICO)';
END $$;

-- 4. Sandra Echeverri
DO $$
DECLARE
    v_id UUID := 'd4e5f6a7-b8c9-0123-defa-456789012345'::UUID;
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'tecnico.vida@correseguros.co', crypt('SGS123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Sandra Echeverri","role":"TECNICO"}', NOW(), NOW())
    ON CONFLICT (email) DO NOTHING;
    
    INSERT INTO users (id, email, name, role, initials, is_active)
    VALUES (v_id, 'tecnico.vida@correseguros.co', 'Sandra Echeverri', 'TECNICO', 'SE', true)
    ON CONFLICT (email) DO NOTHING;
    
    RAISE NOTICE 'Usuario 4/13: Sandra Echeverri (TECNICO)';
END $$;

-- 5. Gonzalo Duque Restrepo
DO $$
DECLARE
    v_id UUID := 'e5f6a7b8-c9d0-1234-efab-567890123456'::UUID;
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'tecnico.jfaseguros@correseguros.co', crypt('SGS123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Gonzalo Duque Restrepo","role":"TECNICO"}', NOW(), NOW())
    ON CONFLICT (email) DO NOTHING;
    
    INSERT INTO users (id, email, name, role, initials, is_active)
    VALUES (v_id, 'tecnico.jfaseguros@correseguros.co', 'Gonzalo Duque Restrepo', 'TECNICO', 'GDR', true)
    ON CONFLICT (email) DO NOTHING;
    
    RAISE NOTICE 'Usuario 5/13: Gonzalo Duque Restrepo (TECNICO)';
END $$;

-- 6. Yobani Gomez
DO $$
DECLARE
    v_id UUID := 'f6a7b8c9-d0e1-2345-fabc-678901234567'::UUID;
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'asistente.jfaseguros@correseguros.co', crypt('SGS123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Yobani Gomez","role":"TECNICO"}', NOW(), NOW())
    ON CONFLICT (email) DO NOTHING;
    
    INSERT INTO users (id, email, name, role, initials, is_active)
    VALUES (v_id, 'asistente.jfaseguros@correseguros.co', 'Yobani Gomez', 'TECNICO', 'YG', true)
    ON CONFLICT (email) DO NOTHING;
    
    RAISE NOTICE 'Usuario 6/13: Yobani Gomez (TECNICO)';
END $$;

-- ============================================================================
-- USUARIOS GERENTE (7)
-- ============================================================================

-- 7. Luz Elena
DO $$
DECLARE
    v_id UUID := 'a7b8c9d0-e1f2-3456-abcd-789012345678'::UUID;
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'elenacorreseguros@gmail.com', crypt('SGS123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Luz Elena","role":"GERENTE"}', NOW(), NOW())
    ON CONFLICT (email) DO NOTHING;
    
    INSERT INTO users (id, email, name, role, initials, is_active)
    VALUES (v_id, 'elenacorreseguros@gmail.com', 'Luz Elena', 'GERENTE', 'LE', true)
    ON CONFLICT (email) DO NOTHING;
    
    RAISE NOTICE 'Usuario 7/13: Luz Elena (GERENTE)';
END $$;

-- 8. Manuel Antonio Velasquez León
DO $$
DECLARE
    v_id UUID := 'b8c9d0e1-f2a3-4567-bcde-890123456789'::UUID;
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'gerencia.comercial@correseguros.co', crypt('SGS123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Manuel Antonio Velasquez León","role":"GERENTE"}', NOW(), NOW())
    ON CONFLICT (email) DO NOTHING;
    
    INSERT INTO users (id, email, name, role, initials, is_active)
    VALUES (v_id, 'gerencia.comercial@correseguros.co', 'Manuel Antonio Velasquez León', 'GERENTE', 'MAVL', true)
    ON CONFLICT (email) DO NOTHING;
    
    RAISE NOTICE 'Usuario 8/13: Manuel Antonio Velasquez León (GERENTE)';
END $$;

-- 9. Carlos Enrique Vallejo
DO $$
DECLARE
    v_id UUID := 'c9d0e1f2-a3b4-5678-cdef-901234567890'::UUID;
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'carlosvallejo@seacompetitivo.com', crypt('SGS123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Carlos Enrique Vallejo","role":"GERENTE"}', NOW(), NOW())
    ON CONFLICT (email) DO NOTHING;
    
    INSERT INTO users (id, email, name, role, initials, is_active)
    VALUES (v_id, 'carlosvallejo@seacompetitivo.com', 'Carlos Enrique Vallejo', 'GERENTE', 'CEV', true)
    ON CONFLICT (email) DO NOTHING;
    
    RAISE NOTICE 'Usuario 9/13: Carlos Enrique Vallejo (GERENTE)';
END $$;

-- 10. Claudia Arbelaez
DO $$
DECLARE
    v_id UUID := 'd0e1f2a3-b4c5-6789-defa-012345678901'::UUID;
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'procesosyproyectos@correseguros.co', crypt('SGS123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Claudia Arbelaez","role":"GERENTE"}', NOW(), NOW())
    ON CONFLICT (email) DO NOTHING;
    
    INSERT INTO users (id, email, name, role, initials, is_active)
    VALUES (v_id, 'procesosyproyectos@correseguros.co', 'Claudia Arbelaez', 'GERENTE', 'CA', true)
    ON CONFLICT (email) DO NOTHING;
    
    RAISE NOTICE 'Usuario 10/13: Claudia Arbelaez (GERENTE)';
END $$;

-- 11. Luis Alberto Gallón
DO $$
DECLARE
    v_id UUID := 'e1f2a3b4-c5d6-7890-efab-123456789012'::UUID;
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'director2jfaseguros@correseguros.co', crypt('SGS123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Luis Alberto Gallón","role":"GERENTE"}', NOW(), NOW())
    ON CONFLICT (email) DO NOTHING;
    
    INSERT INTO users (id, email, name, role, initials, is_active)
    VALUES (v_id, 'director2jfaseguros@correseguros.co', 'Luis Alberto Gallón', 'GERENTE', 'LAG', true)
    ON CONFLICT (email) DO NOTHING;
    
    RAISE NOTICE 'Usuario 11/13: Luis Alberto Gallón (GERENTE)';
END $$;

-- 12. Alejandro Uribe Velez
DO $$
DECLARE
    v_id UUID := 'f2a3b4c5-d6e7-8901-fabc-234567890123'::UUID;
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'auribe@uvseguros.com.co', crypt('SGS123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Alejandro Uribe Velez","role":"GERENTE"}', NOW(), NOW())
    ON CONFLICT (email) DO NOTHING;
    
    INSERT INTO users (id, email, name, role, initials, is_active)
    VALUES (v_id, 'auribe@uvseguros.com.co', 'Alejandro Uribe Velez', 'GERENTE', 'AUV', true)
    ON CONFLICT (email) DO NOTHING;
    
    RAISE NOTICE 'Usuario 12/13: Alejandro Uribe Velez (GERENTE)';
END $$;

-- 13. Lisimaco Cifuentes
DO $$
DECLARE
    v_id UUID := 'a3b4c5d6-e7f8-9012-abcd-345678901234'::UUID;
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'lisimacocorreseguros@gmail.com', crypt('SGS123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Lisimaco Cifuentes","role":"GERENTE"}', NOW(), NOW())
    ON CONFLICT (email) DO NOTHING;
    
    INSERT INTO users (id, email, name, role, initials, is_active)
    VALUES (v_id, 'lisimacocorreseguros@gmail.com', 'Lisimaco Cifuentes', 'GERENTE', 'LC', true)
    ON CONFLICT (email) DO NOTHING;
    
    RAISE NOTICE 'Usuario 13/13: Lisimaco Cifuentes (GERENTE)';
END $$;

-- ============================================================================
-- REACTIVAR RLS Y TRIGGERS
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.users ENABLE TRIGGER ALL;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

SELECT '========================================' as separator;
SELECT 'RESUMEN DE USUARIOS CREADOS' as titulo;
SELECT '========================================' as separator;

SELECT 
    role,
    COUNT(*) as cantidad
FROM users
GROUP BY role
ORDER BY role;

SELECT 
    'Total usuarios: ' || COUNT(*)::text as total
FROM users;

SELECT 
    'Usuarios en auth.users: ' || COUNT(*)::text as total
FROM auth.users
WHERE email LIKE '%correseguros%' OR email LIKE '%@seacompetitivo%' OR email LIKE '%@uvseguros%';

SELECT '========================================' as separator;
SELECT 'DATOS DE LOGIN PARA PRUEBAS' as titulo;
SELECT 'Email: indemnizaciones@correseguros.co' as info;
SELECT 'Contraseña: SGS123456' as info;
SELECT 'Rol: ADMIN' as info;
SELECT '========================================' as separator;

-- Mostrar todos los usuarios creados
SELECT 
    name,
    email,
    role,
    initials
FROM users
ORDER BY role, name;
