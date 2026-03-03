-- ============================================================================
-- FIX V2: Corregir políticas RLS de tabla users - Permisos y Recursión
-- ============================================================================

-- EL PROBLEMA:
-- 1. Las políticas anteriores causaban recursión infinita
-- 2. Las nuevas políticas son demasiado restrictivas (bloquean todo sin auth)

-- LA SOLUCIÓN:
-- 1. Permitir lectura pública de usuarios activos (para la app funcione)
-- 2. Restringir escritura solo al propio usuario o ADMIN
-- 3. Usar auth.users para verificar roles sin recursión

-- ============================================================================
-- 1. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view and edit own profile" ON users;
DROP POLICY IF EXISTS "Admin can manage all users" ON users;
DROP POLICY IF EXISTS "Manager can view all users" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Allow public read of active users" ON users;

-- ============================================================================
-- 2. CREAR POLÍTICAS CORREGIDAS
-- ============================================================================

-- Política 1: Cualquiera puede ver usuarios activos (SELECT público)
-- Esto permite que la app cargue la lista de usuarios sin autenticación
CREATE POLICY "Allow public read of active users" ON users
    FOR SELECT
    USING (is_active = true);

-- Política 2: Usuarios autenticados pueden ver su propio perfil completo
-- (incluso si está inactivo)
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Política 3: Solo el propio usuario puede actualizar su perfil
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Política 4: ADMIN puede hacer todo (usando auth.users sin recursión)
CREATE POLICY "Admin can manage all users" ON users
    FOR ALL
    USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND (
                COALESCE(raw_user_meta_data->>'role', raw_app_meta_data->>'role') = 'ADMIN'
            )
        )
    );

-- ============================================================================
-- 3. VERIFICAR POLÍTICAS
-- ============================================================================

SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles::text, 
    cmd, 
    qual::text as using_clause,
    with_check::text as with_check_clause
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;
