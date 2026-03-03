-- ============================================================================
-- FIX: Corregir políticas RLS de tabla users - Recursión Infinita
-- ============================================================================

-- EL PROBLEMA:
-- Las políticas de users hacen SELECT FROM users dentro de la política,
-- causando recursión infinita (users consulta users, que consulta users...)

-- LA SOLUCIÓN:
-- Usar auth.jwt() -> 'app_metadata' o auth.users en lugar de la tabla users

-- ============================================================================
-- 1. ELIMINAR POLÍTICAS ACTUALES (con recursión)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view and edit own profile" ON users;
DROP POLICY IF EXISTS "Admin can manage all users" ON users;
DROP POLICY IF EXISTS "Manager can view all users" ON users;

-- ============================================================================
-- 2. CREAR NUEVAS POLÍTICAS (sin recursión)
-- ============================================================================

-- Política 1: Usuarios pueden ver/editar su propio perfil
-- Esta NO causa recursión porque usa auth.uid() directamente
CREATE POLICY "Users can view and edit own profile" ON users
    FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Política 2: ADMIN puede ver y editar todos los usuarios
-- Usamos raw_user_meta_data de auth.users en lugar de la tabla users
CREATE POLICY "Admin can manage all users" ON users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND (
                (raw_user_meta_data ->> 'role') = 'ADMIN'
                OR (raw_app_meta_data -> 'role') = '"ADMIN"'
            )
        )
    );

-- Política 3: GERENTE puede ver todos los usuarios (solo lectura)
CREATE POLICY "Manager can view all users" ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND (
                (raw_user_meta_data ->> 'role') = 'GERENTE'
                OR (raw_app_meta_data -> 'role') = '"GERENTE"'
            )
        )
    );

-- ============================================================================
-- 3. VERIFICAR POLÍTICAS CREADAS
-- ============================================================================

-- Mostrar políticas actuales
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';
