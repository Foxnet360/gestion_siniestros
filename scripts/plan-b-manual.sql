-- ============================================================================
-- PLAN B: Si el script anterior no funciona, ejecutar estos comandos UNO POR UNO
-- ============================================================================

-- ============================================================================
-- COMANDO 1: Desactivar RLS (ejecutar primero)
-- ============================================================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Resultado esperado: "ALTER TABLE" (sin errores)

-- ============================================================================
-- COMANDO 2: Verificar tablas (ejecutar segundo)
-- ============================================================================
SELECT 'public.users:' as tabla, COUNT(*) as registros FROM users
UNION ALL
SELECT 'auth.users:' as tabla, COUNT(*) as registros FROM auth.users;

-- Resultado esperado: Verás 0 en ambas o algún número si ya existen usuarios

-- ============================================================================
-- COMANDO 3: Insertar en auth.users (ejecutar tercero)
-- ============================================================================
-- Copia este UUID: fc7c5b8d-6b6c-4f5a-b8e2-9d9c7b6a5f4e
-- O genera uno nuevo en: https://www.uuidgenerator.net/

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
    recovery_token
) VALUES (
    'fc7c5b8d-6b6c-4f5a-b8e2-9d9c7b6a5f4e',  -- UUID fijo
    'indemnizaciones@correseguros.co',
    crypt('SGS123456', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Maryory Espinosa","role":"ADMIN"}',
    NOW(),
    NOW(),
    '',
    ''
);

-- Resultado esperado: "INSERT 0 1" (1 fila insertada)
-- Si da error de duplicado, el usuario ya existe

-- ============================================================================
-- COMANDO 4: Insertar en public.users (ejecutar cuarto)
-- ============================================================================
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
    'fc7c5b8d-6b6c-4f5a-b8e2-9d9c7b6a5f4e',  -- MISMO UUID que arriba
    'indemnizaciones@correseguros.co',
    'Maryory Espinosa Sánchez',
    'ADMIN',
    'MES',
    true,
    NOW(),
    NOW()
);

-- Resultado esperado: "INSERT 0 1" (1 fila insertada)

-- ============================================================================
-- COMANDO 5: Verificar inserción (ejecutar quinto)
-- ============================================================================
SELECT 'auth.users:' as ubicacion, email, raw_user_meta_data->>'role' as rol 
FROM auth.users WHERE email = 'indemnizaciones@correseguros.co'
UNION ALL
SELECT 'public.users:' as ubicacion, email, role 
FROM users WHERE email = 'indemnizaciones@correseguros.co';

-- Resultado esperado: 2 filas mostrando el mismo email en ambas tablas

-- ============================================================================
-- COMANDO 6: Configurar RLS (ejecutar sexto)
-- ============================================================================
-- Eliminar políticas viejas
DROP POLICY IF EXISTS "Allow all operations" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admin can manage all users" ON users;

-- Crear política permisiva
CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true);

-- Activar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Resultado esperado: "CREATE POLICY" y "ALTER TABLE"

-- ============================================================================
-- COMANDO 7: Verificación final (ejecutar último)
-- ============================================================================
SELECT 
    '✅ Usuario creado exitosamente' as mensaje,
    email,
    name,
    role
FROM users 
WHERE email = 'indemnizaciones@correseguros.co';

-- ============================================================================
-- SI TODO FALLA - OPCIÓN MANUAL
-- ============================================================================
/*
Si ningún comando SQL funciona, crear el usuario manualmente:

1. Ve a Supabase Dashboard
2. Ve a "Authentication" en el menú lateral
3. Haz clic en "Users"
4. Haz clic en "Add user" (botón verde arriba a la derecha)
5. Selecciona "Create new user"
6. Completa:
   - Email: indemnizaciones@correseguros.co
   - Password: SGS123456
   - Auto-confirm user: ✅ (marcar)
7. Haz clic en "Create user"
8. Luego ejecuta solo este comando SQL:

INSERT INTO users (id, email, name, role, initials, is_active)
SELECT id, email, 'Maryory Espinosa Sánchez', 'ADMIN', 'MES', true
FROM auth.users 
WHERE email = 'indemnizaciones@correseguros.co';

9. Listo! Refresca la app e intenta login.
*/
