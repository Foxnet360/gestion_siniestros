-- ============================================================================
-- SGS - SOLUCIÓN ERROR 401 (Desarrollo/Testing)
-- ============================================================================
-- Este script desactiva temporalmente las restricciones de seguridad
-- para permitir el desarrollo con MOCK_USERS
-- 
-- ⚠️ IMPORTANTE: No usar en producción sin autenticación real
-- ============================================================================

-- Desactivar RLS en todas las tablas principales
ALTER TABLE claims DISABLE ROW LEVEL SECURITY;
ALTER TABLE state_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE timeline DISABLE ROW LEVEL SECURITY;
ALTER TABLE amparos DISABLE ROW LEVEL SECURITY;

-- Si quieres mantener RLS pero permitir lectura anónima:
-- (Descomenta estas líneas si prefieres esta opción)

-- Política para permitir SELECT sin autenticación
-- CREATE POLICY "Allow anonymous select on claims" ON claims
--     FOR SELECT USING (true);

-- CREATE POLICY "Allow anonymous select on state_history" ON state_history
--     FOR SELECT USING (true);

-- CREATE POLICY "Allow anonymous select on timeline" ON timeline
--     FOR SELECT USING (true);

-- CREATE POLICY "Allow anonymous select on amparos" ON amparos
--     FOR SELECT USING (true);

-- ============================================================================
-- PARA PRODUCCIÓN CON AUTENTICACIÓN REAL (más tarde):
-- ============================================================================
-- 1. Habilitar RLS nuevamente:
--    ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
--
-- 2. Configurar autenticación con Supabase Auth
--    - Ve a Authentication > Providers > Email
--    - Habilita "Enable Email Provider"
--
-- 3. Crear usuarios en Supabase Auth con metadata:
--    {
--      "role": "ADMIN" | "TECNICO" | "ALIADO",
--      "aliadoId": "id_del_aliado" (solo para rol ALIADO)
--    }
--
-- 4. Usar el archivo: supabase_rls_policies.sql
-- ============================================================================

SELECT 'RLS desactivado correctamente - Las tablas ahora permiten acceso sin autenticación' as status;
