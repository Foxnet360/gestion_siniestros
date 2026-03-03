-- ============================================================================
-- SGS - SCRIPT ALTERNATIVO (Sin DROP TABLE)
-- Versión: 4.0 - Para cuando no tienes permisos de propietario
-- Fecha: 2026-03-02
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONES NECESARIAS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. TABLA PRINCIPAL: CLAIMS (Crear si no existe)
-- ============================================================================

CREATE TABLE IF NOT EXISTS claims (
    id_softseguros TEXT PRIMARY KEY,
    id_interno TEXT,
    numero_siniestro TEXT NOT NULL,
    poliza TEXT,
    asegurado TEXT,
    estado_softseguros TEXT,
    estado_interno TEXT NOT NULL DEFAULT 'AVISO SINIESTRO',
    usuario_registro TEXT,
    tecnico_asignado TEXT,
    tecnico_id UUID,
    aliado_origen TEXT,
    placa_bien TEXT,
    ramo TEXT,
    aseguradora TEXT,
    vendedor TEXT,
    prioridad TEXT DEFAULT 'MEDIA',
    monto_reclamo NUMERIC DEFAULT 0,
    valor_deducible NUMERIC DEFAULT 0,
    valor_indemnizacion NUMERIC DEFAULT 0,
    fecha_ocurrencia TIMESTAMP,
    ultimo_seguimiento_raw TEXT,
    lastStateChangeDate TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    numero_siniestro_compania TEXT,
    tipo_siniestro TEXT,
    fecha_aviso DATE,
    fecha_notificacion_aseguradora DATE,
    proveedor_asignado TEXT,
    descripcion TEXT,
    documento_asegurado TEXT,
    email_principal TEXT,
    celular_principal TEXT,
    porcentaje_siniestralidad NUMERIC,
    finalizado BOOLEAN DEFAULT FALSE,
    fecha_finalizacion DATE,
    coaseguros NUMERIC,
    gestion_softseguros TEXT,
    estado_gestion_softseguros TEXT,
    prescripcion_ordinaria DATE,
    prescripcion_extraordinaria DATE,
    proximo_seguimiento TIMESTAMP
);

-- ============================================================================
-- 3. TABLAS RELACIONADAS (Crear si no existen)
-- ============================================================================

CREATE TABLE IF NOT EXISTS state_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id TEXT NOT NULL REFERENCES claims(id_softseguros) ON DELETE CASCADE,
    state TEXT NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    days_duration INTEGER,
    author TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id TEXT NOT NULL REFERENCES claims(id_softseguros) ON DELETE CASCADE,
    date TIMESTAMP NOT NULL,
    author TEXT NOT NULL,
    text TEXT NOT NULL,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS amparos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id TEXT NOT NULL REFERENCES claims(id_softseguros) ON DELETE CASCADE,
    numero_siniestro TEXT NOT NULL,
    nombre_reclamante TEXT NOT NULL,
    amparo TEXT NOT NULL,
    valor NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'GERENTE', 'TECNICO', 'ALIADO')),
    initials VARCHAR(10) NOT NULL,
    aliado_id VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. LIMPIAR DATOS EXISTENTES (Si las tablas ya existen)
-- ============================================================================

-- Limpiar usuarios existentes (excepto los que vamos a crear)
DELETE FROM users WHERE email LIKE '%correseguros%' OR email LIKE '%@seacompetitivo%' OR email LIKE '%@uvseguros%';
DELETE FROM auth.users WHERE email LIKE '%correseguros%' OR email LIKE '%@seacompetitivo%' OR email LIKE '%@uvseguros%';

-- Limpiar tablas relacionadas si es necesario
-- DELETE FROM audit_logs; -- Opcional: descomentar si quieres limpiar auditoría

-- ============================================================================
-- 5. ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_claims_estado_softseguros ON claims(estado_softseguros);
CREATE INDEX IF NOT EXISTS idx_claims_aseguradora ON claims(aseguradora);
CREATE INDEX IF NOT EXISTS idx_claims_tecnico ON claims(tecnico_asignado);
CREATE INDEX IF NOT EXISTS idx_claims_tecnico_id ON claims(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims(created_at);
CREATE INDEX IF NOT EXISTS idx_claims_estado_interno ON claims(estado_interno);
CREATE INDEX IF NOT EXISTS idx_claims_finalizado ON claims(finalizado);

CREATE INDEX IF NOT EXISTS idx_state_history_claim_id ON state_history(claim_id);
CREATE INDEX IF NOT EXISTS idx_timeline_claim_id ON timeline(claim_id);
CREATE INDEX IF NOT EXISTS idx_amparos_claim_id ON amparos(claim_id);
CREATE INDEX IF NOT EXISTS idx_amparos_composite ON amparos(claim_id, amparo, nombre_reclamante);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- 6. FUNCIONES
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
    v_user_id := extensions.uuid_generate_v4();
    
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, new_email
    ) VALUES (
        v_user_id, '00000000-0000-0000-0000-000000000000', p_email,
        crypt(p_password, gen_salt('bf')), NOW(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('name', p_name, 'role', p_role),
        NOW(), NOW(), '', '', '', NULL
    );
    
    INSERT INTO users (id, email, name, role, initials, aliado_id, is_active)
    VALUES (v_user_id, p_email, p_name, p_role, p_initials, p_aliado_id, true);
    
    RETURN v_user_id;
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'Usuario % ya existe, omitiendo', p_email;
        RETURN NULL;
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creando %: %', p_email, SQLERRM;
        RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION log_audit_action(
    p_action VARCHAR, p_entity_type VARCHAR, p_entity_id VARCHAR, p_details JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details);
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE IF EXISTS claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS state_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS amparos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON claims;
DROP POLICY IF EXISTS "Allow all" ON state_history;
DROP POLICY IF EXISTS "Allow all" ON timeline;
DROP POLICY IF EXISTS "Allow all" ON amparos;
DROP POLICY IF EXISTS "Allow all" ON users;
DROP POLICY IF EXISTS "Allow all" ON audit_logs;

CREATE POLICY "Allow all" ON claims FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON state_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON timeline FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON amparos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 8. CREAR USUARIOS (13 usuarios)
-- ============================================================================

DO $$
DECLARE
    v_id UUID;
BEGIN
    -- Desactivar triggers temporalmente
    ALTER TABLE auth.users DISABLE TRIGGER ALL;
    
    -- 1. Maryory Espinosa Sánchez (ADMIN)
    BEGIN
        v_id := extensions.uuid_generate_v4();
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, new_email)
        VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'indemnizaciones@correseguros.co', crypt('SGS123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Maryory Espinosa Sánchez","role":"ADMIN"}', NOW(), NOW(), '', '', '', NULL)
        ON CONFLICT (email) DO NOTHING;
        INSERT INTO users (id, email, name, role, initials, is_active) VALUES (v_id, 'indemnizaciones@correseguros.co', 'Maryory Espinosa Sánchez', 'ADMIN', 'MES', true) ON CONFLICT (email) DO NOTHING;
        RAISE NOTICE 'Usuario 1/13: Maryory Espinosa Sánchez (ADMIN)';
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Error usuario 1: %', SQLERRM; END;

    -- 2. Alejandro Cardona (ADMIN)
    BEGIN
        v_id := extensions.uuid_generate_v4();
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, new_email)
        VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'info@correseguros.co', crypt('SGS123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Alejandro Cardona","role":"ADMIN"}', NOW(), NOW(), '', '', '', NULL)
        ON CONFLICT (email) DO NOTHING;
        INSERT INTO users (id, email, name, role, initials, is_active) VALUES (v_id, 'info@correseguros.co', 'Alejandro Cardona', 'ADMIN', 'AC', true) ON CONFLICT (email) DO NOTHING;
        RAISE NOTICE 'Usuario 2/13: Alejandro Cardona (ADMIN)';
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Error usuario 2: %', SQLERRM; END;

    -- 3. Sara Lucía Bedoya Velásquez (TECNICO)
    BEGIN
        v_id := extensions.uuid_generate_v4();
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, new_email)
        VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'indemnizaciones1@correseguros.co', crypt('SGS123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Sara Lucía Bedoya Velásquez","role":"TECNICO"}', NOW(), NOW(), '', '', '', NULL)
        ON CONFLICT (email) DO NOTHING;
        INSERT INTO users (id, email, name, role, initials, is_active) VALUES (v_id, 'indemnizaciones1@correseguros.co', 'Sara Lucía Bedoya Velásquez', 'TECNICO', 'SLBV', true) ON CONFLICT (email) DO NOTHING;
        RAISE NOTICE 'Usuario 3/13: Sara Lucía Bedoya Velásquez (TECNICO)';
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Error usuario 3: %', SQLERRM; END;

    -- 4. Sandra Echeverri (TECNICO)
    BEGIN
        v_id := extensions.uuid_generate_v4();
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, new_email)
        VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'tecnico.vida@correseguros.co', crypt('SGS123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Sandra Echeverri","role":"TECNICO"}', NOW(), NOW(), '', '', '', NULL)
        ON CONFLICT (email) DO NOTHING;
        INSERT INTO users (id, email, name, role, initials, is_active) VALUES (v_id, 'tecnico.vida@correseguros.co', 'Sandra Echeverri', 'TECNICO', 'SE', true) ON CONFLICT (email) DO NOTHING;
        RAISE NOTICE 'Usuario 4/13: Sandra Echeverri (TECNICO)';
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Error usuario 4: %', SQLERRM; END;

    -- 5. Gonzalo Duque Restrepo (TECNICO)
    BEGIN
        v_id := extensions.uuid_generate_v4();
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, new_email)
        VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'tecnico.jfaseguros@correseguros.co', crypt('SGS123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Gonzalo Duque Restrepo","role":"TECNICO"}', NOW(), NOW(), '', '', '', NULL)
        ON CONFLICT (email) DO NOTHING;
        INSERT INTO users (id, email, name, role, initials, is_active) VALUES (v_id, 'tecnico.jfaseguros@correseguros.co', 'Gonzalo Duque Restrepo', 'TECNICO', 'GDR', true) ON CONFLICT (email) DO NOTHING;
        RAISE NOTICE 'Usuario 5/13: Gonzalo Duque Restrepo (TECNICO)';
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Error usuario 5: %', SQLERRM; END;

    -- 6. Yobani Gomez (TECNICO)
    BEGIN
        v_id := extensions.uuid_generate_v4();
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, new_email)
        VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'asistente.jfaseguros@correseguros.co', crypt('SGS123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Yobani Gomez","role":"TECNICO"}', NOW(), NOW(), '', '', '', NULL)
        ON CONFLICT (email) DO NOTHING;
        INSERT INTO users (id, email, name, role, initials, is_active) VALUES (v_id, 'asistente.jfaseguros@correseguros.co', 'Yobani Gomez', 'TECNICO', 'YG', true) ON CONFLICT (email) DO NOTHING;
        RAISE NOTICE 'Usuario 6/13: Yobani Gomez (TECNICO)';
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Error usuario 6: %', SQLERRM; END;

    -- 7. Luz Elena (GERENTE)
    BEGIN
        v_id := extensions.uuid_generate_v4();
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, new_email)
        VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'elenacorreseguros@gmail.com', crypt('SGS123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Luz Elena","role":"GERENTE"}', NOW(), NOW(), '', '', '', NULL)
        ON CONFLICT (email) DO NOTHING;
        INSERT INTO users (id, email, name, role, initials, is_active) VALUES (v_id, 'elenacorreseguros@gmail.com', 'Luz Elena', 'GERENTE', 'LE', true) ON CONFLICT (email) DO NOTHING;
        RAISE NOTICE 'Usuario 7/13: Luz Elena (GERENTE)';
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Error usuario 7: %', SQLERRM; END;

    -- 8. Manuel Antonio Velasquez León (GERENTE)
    BEGIN
        v_id := extensions.uuid_generate_v4();
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, new_email)
        VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'gerencia.comercial@correseguros.co', crypt('SGS123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Manuel Antonio Velasquez León","role":"GERENTE"}', NOW(), NOW(), '', '', '', NULL)
        ON CONFLICT (email) DO NOTHING;
        INSERT INTO users (id, email, name, role, initials, is_active) VALUES (v_id, 'gerencia.comercial@correseguros.co', 'Manuel Antonio Velasquez León', 'GERENTE', 'MAVL', true) ON CONFLICT (email) DO NOTHING;
        RAISE NOTICE 'Usuario 8/13: Manuel Antonio Velasquez León (GERENTE)';
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Error usuario 8: %', SQLERRM; END;

    -- 9. Carlos Enrique Vallejo (GERENTE)
    BEGIN
        v_id := extensions.uuid_generate_v4();
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, new_email)
        VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'carlosvallejo@seacompetitivo.com', crypt('SGS123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Carlos Enrique Vallejo","role":"GERENTE"}', NOW(), NOW(), '', '', '', NULL)
        ON CONFLICT (email) DO NOTHING;
        INSERT INTO users (id, email, name, role, initials, is_active) VALUES (v_id, 'carlosvallejo@seacompetitivo.com', 'Carlos Enrique Vallejo', 'GERENTE', 'CEV', true) ON CONFLICT (email) DO NOTHING;
        RAISE NOTICE 'Usuario 9/13: Carlos Enrique Vallejo (GERENTE)';
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Error usuario 9: %', SQLERRM; END;

    -- 10. Claudia Arbelaez (GERENTE)
    BEGIN
        v_id := extensions.uuid_generate_v4();
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, new_email)
        VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'procesosyproyectos@correseguros.co', crypt('SGS123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Claudia Arbelaez","role":"GERENTE"}', NOW(), NOW(), '', '', '', NULL)
        ON CONFLICT (email) DO NOTHING;
        INSERT INTO users (id, email, name, role, initials, is_active) VALUES (v_id, 'procesosyproyectos@correseguros.co', 'Claudia Arbelaez', 'GERENTE', 'CA', true) ON CONFLICT (email) DO NOTHING;
        RAISE NOTICE 'Usuario 10/13: Claudia Arbelaez (GERENTE)';
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Error usuario 10: %', SQLERRM; END;

    -- 11. Luis Alberto Gallón (GERENTE)
    BEGIN
        v_id := extensions.uuid_generate_v4();
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, new_email)
        VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'director2jfaseguros@correseguros.co', crypt('SGS123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Luis Alberto Gallón","role":"GERENTE"}', NOW(), NOW(), '', '', '', NULL)
        ON CONFLICT (email) DO NOTHING;
        INSERT INTO users (id, email, name, role, initials, is_active) VALUES (v_id, 'director2jfaseguros@correseguros.co', 'Luis Alberto Gallón', 'GERENTE', 'LAG', true) ON CONFLICT (email) DO NOTHING;
        RAISE NOTICE 'Usuario 11/13: Luis Alberto Gallón (GERENTE)';
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Error usuario 11: %', SQLERRM; END;

    -- 12. Alejandro Uribe Velez (GERENTE)
    BEGIN
        v_id := extensions.uuid_generate_v4();
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, new_email)
        VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'auribe@uvseguros.com.co', crypt('SGS123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Alejandro Uribe Velez","role":"GERENTE"}', NOW(), NOW(), '', '', '', NULL)
        ON CONFLICT (email) DO NOTHING;
        INSERT INTO users (id, email, name, role, initials, is_active) VALUES (v_id, 'auribe@uvseguros.com.co', 'Alejandro Uribe Velez', 'GERENTE', 'AUV', true) ON CONFLICT (email) DO NOTHING;
        RAISE NOTICE 'Usuario 12/13: Alejandro Uribe Velez (GERENTE)';
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Error usuario 12: %', SQLERRM; END;

    -- 13. Lisimaco Cifuentes (GERENTE)
    BEGIN
        v_id := extensions.uuid_generate_v4();
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, new_email)
        VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'lisimacocorreseguros@gmail.com', crypt('SGS123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Lisimaco Cifuentes","role":"GERENTE"}', NOW(), NOW(), '', '', '', NULL)
        ON CONFLICT (email) DO NOTHING;
        INSERT INTO users (id, email, name, role, initials, is_active) VALUES (v_id, 'lisimacocorreseguros@gmail.com', 'Lisimaco Cifuentes', 'GERENTE', 'LC', true) ON CONFLICT (email) DO NOTHING;
        RAISE NOTICE 'Usuario 13/13: Lisimaco Cifuentes (GERENTE)';
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Error usuario 13: %', SQLERRM; END;

    -- Reactivar triggers
    ALTER TABLE auth.users ENABLE TRIGGER ALL;
    
END $$;

-- ============================================================================
-- 9. VERIFICACIÓN FINAL
-- ============================================================================

SELECT '========================================' as separator;
SELECT 'ESQUEMA CREADO/ACTUALIZADO' as titulo;
SELECT '========================================' as separator;

SELECT 
    'Usuarios creados:' as info,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM auth.users WHERE email LIKE '%correseguros%' OR email LIKE '%@seacompetitivo%' OR email LIKE '%@uvseguros%') as total_auth_users;

SELECT 
    'Por rol:' as info,
    role,
    COUNT(*) as cantidad
FROM users
GROUP BY role
ORDER BY role;

SELECT '========================================' as separator;
SELECT 'DATOS DE LOGIN:' as titulo;
SELECT 'Email: indemnizaciones@correseguros.co' as dato;
SELECT 'Contraseña: SGS123456' as dato;
SELECT 'Rol: ADMIN' as dato;
SELECT '========================================' as separator;

SELECT name, email, role, initials FROM users ORDER BY role, name;
