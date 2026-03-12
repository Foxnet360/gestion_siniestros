-- Script de Verificación SQL para Supabase
-- Ejecutar esto en el SQL Editor del Dashboard de Supabase
-- https://supabase.com/dashboard/project/_/sql/new

-- ============================================================
-- 1. VERIFICAR CONEXIÓN Y PERMISOS
-- ============================================================

-- Verificar versión de PostgreSQL y usuario actual
SELECT 
    version() as postgresql_version,
    current_user as current_user,
    current_database() as database_name,
    pg_database_size(current_database()) as database_size_bytes;

-- ============================================================
-- 2. VERIFICAR PERMISOS DE CREACIÓN
-- ============================================================

-- Verificar si el usuario tiene permiso CREATE
SELECT 
    has_database_privilege(current_user, current_database(), 'CREATE') as can_create,
    has_schema_privilege('public', 'CREATE') as can_create_in_public_schema,
    has_schema_privilege('public', 'USAGE') as can_use_public_schema;

-- ============================================================
-- 3. CREAR FUNCIÓN DE PRUEBA
-- ============================================================

-- Esta función verifica que podemos crear y ejecutar funciones SQL
CREATE OR REPLACE FUNCTION verify_sql_access()
RETURNS TABLE (
    test_name TEXT,
    test_result TEXT,
    details TEXT
) AS $$
BEGIN
    -- Test 1: Verificar acceso básico
    RETURN QUERY SELECT 
        'Acceso básico'::TEXT,
        '✅ OK'::TEXT,
        'Conexión a PostgreSQL exitosa'::TEXT;

    -- Test 2: Verificar permisos de creación
    RETURN QUERY SELECT 
        'Permisos CREATE'::TEXT,
        CASE 
            WHEN has_database_privilege(current_user, current_database(), 'CREATE')
            THEN '✅ OK'
            ELSE '❌ FAIL'
        END::TEXT,
        'Permiso para crear funciones e índices'::TEXT;

    -- Test 3: Verificar tablas críticas
    RETURN QUERY 
    SELECT 
        'Tabla: ' || table_name,
        '✅ OK',
        'Tabla existe en el esquema'
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('claims', 'siniestro_etapas', 'amparos', 'claim_amparos');

    -- Test 4: Verificar índices existentes
    RETURN QUERY 
    SELECT 
        'Índices en ' || tablename,
        '✅ OK',
        COUNT(*)::TEXT || ' índices encontrados'
    FROM pg_indexes 
    WHERE schemaname = 'public'
    AND tablename IN ('siniestro_etapas', 'claims')
    GROUP BY tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. EJECUTAR FUNCIÓN DE PRUEBA
-- ============================================================

SELECT * FROM verify_sql_access();

-- ============================================================
-- 5. VERIFICAR ÍNDICES ACTUALES
-- ============================================================

-- Ver índices existentes en tablas críticas
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('siniestro_etapas', 'claims', 'amparos', 'claim_amparos')
ORDER BY tablename, indexname;

-- ============================================================
-- 6. CONTAR REGISTROS (para verificar volumen de datos)
-- ============================================================

SELECT 
    'claims' as tabla,
    COUNT(*) as total_registros
FROM claims
UNION ALL
SELECT 
    'siniestro_etapas',
    COUNT(*)
FROM siniestro_etapas
UNION ALL
SELECT 
    'amparos',
    COUNT(*)
FROM amparos
UNION ALL
SELECT 
    'claim_amparos',
    COUNT(*)
FROM claim_amparos;

-- ============================================================
-- 7. LIMPIAR (opcional - descomentar si se desea eliminar)
-- ============================================================

-- DROP FUNCTION IF EXISTS verify_sql_access();

/*
============================================================
RESULTADO ESPERADO:
============================================================

Si todo funciona correctamente, deberías ver:

1. postgresql_version: PostgreSQL 15.x...
2. can_create: true
3. verify_sql_access() debe retornar varias filas con ✅ OK
4. Lista de índices existentes
5. Conteo de registros en cada tabla

Si can_create es false, necesitas contactar al administrador
para obtener permisos de CREATE en la base de datos.
============================================================
*/
