-- ============================================================================
-- MÉTODO NUCLEAR: Desactivar todos los triggers y crear usuario
-- ============================================================================
-- ⚠️ ADVERTENCIA: Esto desactiva temporalmente TODOS los triggers del sistema
-- ============================================================================

-- PASO 1: Desactivar todos los triggers (modo replica)
SET session_replication_role = 'replica';

-- PASO 2: Crear usuario en auth.users (mínimo necesario)
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
) VALUES (
    '11111111-2222-3333-4444-555555555555',
    'indemnizaciones@correseguros.co',
    crypt('SGS123456', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- PASO 3: Crear usuario en public.users
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
    '11111111-2222-3333-4444-555555555555',
    'indemnizaciones@correseguros.co',
    'Maryory Espinosa Sánchez',
    'ADMIN',
    'MES',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- PASO 4: Reactivar triggers
SET session_replication_role = 'origin';

-- PASO 5: Verificar
SELECT 
    'RESULTADO:' as titulo,
    (SELECT COUNT(*) FROM auth.users WHERE email = 'indemnizaciones@correseguros.co') as en_auth_users,
    (SELECT COUNT(*) FROM users WHERE email = 'indemnizaciones@correseguros.co') as en_public_users;

-- Si ambos muestran "1", el usuario fue creado ✅
-- Si muestran "0", hubo un error ❌
