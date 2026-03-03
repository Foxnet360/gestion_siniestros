-- ============================================================================
-- SGS - ESQUEMA COMPLETO DE BASE DE DATOS
-- Versión: 2.0 - Sincronización completa con Supabase
-- Fecha: 2026-03-02
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONES NECESARIAS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. TABLA DE USUARIOS (Perfiles públicos)
-- ============================================================================

DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'GERENTE', 'TECNICO', 'ALIADO')),
    initials VARCHAR(10) NOT NULL,
    aliado_id VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. TABLA DE AUDITORÍA
-- ============================================================================

DROP TABLE IF EXISTS audit_logs CASCADE;

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. ACTUALIZACIÓN DE TABLA CLAIMS
-- ============================================================================

-- Agregar columna tecnico_id si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'claims' AND column_name = 'tecnico_id') THEN
        ALTER TABLE claims ADD COLUMN tecnico_id UUID REFERENCES users(id);
    END IF;
END $$;

-- Agregar columna created_at si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'claims' AND column_name = 'created_at') THEN
        ALTER TABLE claims ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- ============================================================================
-- 5. ÍNDICES PARA USUARIOS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_aliado_id ON users(aliado_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- ============================================================================
-- 6. ÍNDICES PARA AUDITORÍA
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id_created_at ON audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- 7. ÍNDICES PARA CLAIMS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_claims_tecnico_id_estado ON claims(tecnico_id, estado_interno);
CREATE INDEX IF NOT EXISTS idx_claims_created_at_estado ON claims(created_at, estado_interno);
CREATE INDEX IF NOT EXISTS idx_claims_aseguradora_fecha ON claims(aseguradora, fecha_ocurrencia);

-- ============================================================================
-- 8. FUNCIÓN PARA CREAR USUARIO CON AUTENTICACIÓN
-- ============================================================================

CREATE OR REPLACE FUNCTION create_user_with_auth(
    p_email VARCHAR,
    p_password VARCHAR,
    p_name VARCHAR,
    p_role VARCHAR,
    p_initials VARCHAR,
    p_aliado_id VARCHAR DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Generar UUID
    v_user_id := extensions.uuid_generate_v4();
    
    -- Insertar en auth.users
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        new_email
    ) VALUES (
        v_user_id,
        '00000000-0000-0000-0000-000000000000',
        p_email,
        crypt(p_password, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('name', p_name, 'role', p_role),
        NOW(),
        NOW(),
        '',
        '',
        '',
        NULL
    );
    
    -- Insertar en public.users
    INSERT INTO users (id, email, name, role, initials, aliado_id, is_active)
    VALUES (v_user_id, p_email, p_name, p_role, p_initials, p_aliado_id, true);
    
    RETURN v_user_id;
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'El email % ya existe', p_email;
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creando usuario: %', SQLERRM;
END;
$$;

-- ============================================================================
-- 9. FUNCIÓN PARA AUDITORÍA
-- ============================================================================

CREATE OR REPLACE FUNCTION log_audit_action(
    p_action VARCHAR,
    p_entity_type VARCHAR,
    p_entity_id VARCHAR,
    p_details JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details);
EXCEPTION
    WHEN OTHERS THEN
        -- No fallar si no se puede loggear
        NULL;
END;
$$;

-- ============================================================================
-- 10. ROW LEVEL SECURITY - TABLA USERS
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas anteriores
DROP POLICY IF EXISTS "Allow all operations" ON users;
DROP POLICY IF EXISTS "Allow select for all" ON users;
DROP POLICY IF EXISTS "Allow modify for authenticated" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admin can manage all users" ON users;
DROP POLICY IF EXISTS "Manager can view all users" ON users;
DROP POLICY IF EXISTS "Allow all" ON users;

-- Política permisiva para desarrollo (cambiar en producción)
CREATE POLICY "Allow all" ON users
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- 11. ROW LEVEL SECURITY - TABLA AUDIT_LOGS
-- ============================================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON audit_logs;

CREATE POLICY "Allow all" ON audit_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- 12. ROW LEVEL SECURITY - TABLA CLAIMS
-- ============================================================================

ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON claims;

CREATE POLICY "Allow all" ON claims
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- 13. TRIGGER PARA ACTUALIZAR updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 14. VERIFICACIÓN DE INSTALACIÓN
-- ============================================================================

SELECT '========================================' as separator;
SELECT 'ESQUEMA INSTALADO CORRECTAMENTE' as mensaje;
SELECT '========================================' as separator;

SELECT 
    'Tabla users: ' || COUNT(*) || ' registros' as estado
FROM users
UNION ALL
SELECT 
    'Tabla audit_logs: ' || COUNT(*) || ' registros'
FROM audit_logs;

SELECT 
    'Funciones creadas:' as info,
    proname as nombre
FROM pg_proc 
WHERE proname IN ('create_user_with_auth', 'log_audit_action', 'update_updated_at_column')
ORDER BY proname;

-- ============================================================================
-- 15. CREAR USUARIO ADMIN INICIAL (Opcional - descomentar si se necesita)
-- ============================================================================

/*
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@softseguros.com') THEN
        PERFORM create_user_with_auth(
            'admin@softseguros.com',
            'Admin123!',
            'Administrador Principal',
            'ADMIN',
            'AP'
        );
        RAISE NOTICE 'Usuario admin creado';
    END IF;
END $$;
*/

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
