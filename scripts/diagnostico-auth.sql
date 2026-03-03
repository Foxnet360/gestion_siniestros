-- ============================================================================
-- DIAGNÓSTICO: Verificar qué está pasando
-- ============================================================================

-- 1. Verificar si tenemos permisos para ver auth.users
SELECT 'Permisos en auth.users:' as check_item,
       has_schema_privilege('auth', 'USAGE') as can_use_schema,
       has_table_privilege('auth.users', 'SELECT') as can_select,
       has_table_privilege('auth.users', 'INSERT') as can_insert;

-- 2. Verificar si el usuario existe (query directo)
SELECT 'auth.users direct query:' as check_item, COUNT(*) as count 
FROM auth.users 
WHERE email = 'indemnizaciones@correseguros.co';

-- 3. Verificar todas las tablas de auth
SELECT 'Tablas en schema auth:' as info, tablename 
FROM pg_tables 
WHERE schemaname = 'auth';

-- 4. Verificar triggers en auth.users
SELECT 'Triggers en auth.users:' as info, tgname, tgenabled 
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass 
AND tgname NOT LIKE 'pg_%';
