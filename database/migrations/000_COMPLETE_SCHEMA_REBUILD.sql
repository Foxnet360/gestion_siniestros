-- ============================================================================
-- SGS - SCRIPT COMPLETO DE CREACIÓN DE ESQUEMA
-- Versión: 3.0 - Todo en uno
-- Fecha: 2026-03-02
-- Descripción: Crea todo el esquema de base de datos desde cero
-- ============================================================================

-- ============================================================================
-- 0. LIMPIEZA Y PREPARACIÓN
-- ============================================================================

-- Desactivar RLS temporalmente para poder trabajar
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS claims DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS state_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS timeline DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS amparos DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 1. EXTENSIONES NECESARIAS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. TABLA PRINCIPAL: CLAIMS (Siniestros)
-- ============================================================================

DROP TABLE IF EXISTS claims CASCADE;

CREATE TABLE claims (
    -- Campos Core (IDs y básicos)
    id_softseguros TEXT PRIMARY KEY,
    id_interno TEXT,
    numero_siniestro TEXT NOT NULL,
    poliza TEXT,
    asegurado TEXT,
    
    -- Estados
    estado_softseguros TEXT,
    estado_interno TEXT NOT NULL DEFAULT 'AVISO SINIESTRO',
    
    -- Usuarios y asignaciones
    usuario_registro TEXT,
    tecnico_asignado TEXT,
    tecnico_id UUID,
    aliado_origen TEXT,
    
    -- Datos del bien
    placa_bien TEXT,
    ramo TEXT,
    aseguradora TEXT,
    vendedor TEXT,
    
    -- Prioridad y montos
    prioridad TEXT DEFAULT 'MEDIA',
    monto_reclamo NUMERIC DEFAULT 0,
    valor_deducible NUMERIC DEFAULT 0,
    valor_indemnizacion NUMERIC DEFAULT 0,
    
    -- Fechas principales
    fecha_ocurrencia TIMESTAMP,
    ultimo_seguimiento_raw TEXT,
    
    -- Gestión interna
    lastStateChangeDate TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Campos extendidos (SoftSeguros)
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
    
    -- Campos híbridos
    gestion_softseguros TEXT,
    estado_gestion_softseguros TEXT,
    
    -- Campos calculados
    prescripcion_ordinaria DATE,
    prescripcion_extraordinaria DATE,
    
    -- Gestión interna
    proximo_seguimiento TIMESTAMP
);

-- Comentarios para documentación
COMMENT ON TABLE claims IS 'Tabla principal de siniestros del SGS';
COMMENT ON COLUMN claims.id_softseguros IS 'ID único desde SoftSeguros CRM';
COMMENT ON COLUMN claims.estado_interno IS 'Estado del workflow interno';
COMMENT ON COLUMN claims.tecnico_id IS 'Referencia UUID a tabla users';

-- ============================================================================
-- 3. TABLA: STATE_HISTORY (Historial de Estados)
-- ============================================================================

DROP TABLE IF EXISTS state_history CASCADE;

CREATE TABLE state_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id TEXT NOT NULL REFERENCES claims(id_softseguros) ON DELETE CASCADE,
    state TEXT NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    days_duration INTEGER,
    author TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE state_history IS 'Registra cambios de estado con duración';

-- ============================================================================
-- 4. TABLA: TIMELINE (Línea de Tiempo)
-- ============================================================================

DROP TABLE IF EXISTS timeline CASCADE;

CREATE TABLE timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id TEXT NOT NULL REFERENCES claims(id_softseguros) ON DELETE CASCADE,
    date TIMESTAMP NOT NULL,
    author TEXT NOT NULL,
    text TEXT NOT NULL,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE timeline IS 'Eventos y notas de seguimiento';

-- ============================================================================
-- 5. TABLA: AMPAROS (Coberturas)
-- ============================================================================

DROP TABLE IF EXISTS amparos CASCADE;

CREATE TABLE amparos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id TEXT NOT NULL REFERENCES claims(id_softseguros) ON DELETE CASCADE,
    numero_siniestro TEXT NOT NULL,
    nombre_reclamante TEXT NOT NULL,
    amparo TEXT NOT NULL,
    valor NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE amparos IS 'Coberturas/amparos por siniestro';

-- ============================================================================
-- 6. TABLA: USERS (Perfiles de Usuarios)
-- ============================================================================

DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
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

COMMENT ON TABLE users IS 'Perfiles públicos de usuarios (enlazados a auth.users)';

-- ============================================================================
-- 7. TABLA: AUDIT_LOGS (Auditoría)
-- ============================================================================

DROP TABLE IF EXISTS audit_logs CASCADE;

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'Registro de acciones del sistema';

-- ============================================================================
-- 8. ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Claims
CREATE INDEX idx_claims_estado_softseguros ON claims(estado_softseguros);
CREATE INDEX idx_claims_aseguradora ON claims(aseguradora);
CREATE INDEX idx_claims_tecnico ON claims(tecnico_asignado);
CREATE INDEX idx_claims_tecnico_id ON claims(tecnico_id);
CREATE INDEX idx_claims_created_at ON claims(created_at);
CREATE INDEX idx_claims_estado_interno ON claims(estado_interno);
CREATE INDEX idx_claims_finalizado ON claims(finalizado);

-- State History
CREATE INDEX idx_state_history_claim_id ON state_history(claim_id);

-- Timeline
CREATE INDEX idx_timeline_claim_id ON timeline(claim_id);

-- Amparos
CREATE INDEX idx_amparos_claim_id ON amparos(claim_id);
CREATE INDEX idx_amparos_composite ON amparos(claim_id, amparo, nombre_reclamante);

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Audit Logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ============================================================================
-- 9. FUNCIONES
-- ============================================================================

-- Función para crear usuario con autenticación
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

-- Función para auditoría
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
        NULL; -- No fallar si no se puede loggear
END;
$$;

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Trigger para users
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS) - PERMISIVO PARA DESARROLLO
-- ============================================================================

-- Activar RLS en todas las tablas
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE amparos ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas (permitir todo)
CREATE POLICY "Allow all" ON claims FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON state_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON timeline FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON amparos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 11. CREAR USUARIOS DE PRODUCCIÓN (13 usuarios)
-- ============================================================================

-- Desactivar triggers temporalmente para inserción masiva
ALTER TABLE auth.users DISABLE TRIGGER ALL;

-- =====================================
-- USUARIOS ADMIN (2)
-- =====================================

-- 1. Maryory Espinosa Sánchez
DO $$
BEGIN
    PERFORM create_user_with_auth(
        'indemnizaciones@correseguros.co',
        'SGS123456',
        'Maryory Espinosa Sánchez',
        'ADMIN',
        'MES'
    );
    RAISE NOTICE 'Usuario 1/13 creado: Maryory Espinosa Sánchez (ADMIN)';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Usuario 1 ya existe o error: %', SQLERRM;
END $$;

-- 2. Alejandro Cardona
DO $$
BEGIN
    PERFORM create_user_with_auth(
        'info@correseguros.co',
        'SGS123456',
        'Alejandro Cardona',
        'ADMIN',
        'AC'
    );
    RAISE NOTICE 'Usuario 2/13 creado: Alejandro Cardona (ADMIN)';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Usuario 2 ya existe o error: %', SQLERRM;
END $$;

-- =====================================
-- USUARIOS TECNICO (4)
-- =====================================

-- 3. Sara Lucía Bedoya Velásquez
DO $$
BEGIN
    PERFORM create_user_with_auth(
        'indemnizaciones1@correseguros.co',
        'SGS123456',
        'Sara Lucía Bedoya Velásquez',
        'TECNICO',
        'SLBV'
    );
    RAISE NOTICE 'Usuario 3/13 creado: Sara Lucía Bedoya Velásquez (TECNICO)';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Usuario 3 ya existe o error: %', SQLERRM;
END $$;

-- 4. Sandra Echeverri
DO $$
BEGIN
    PERFORM create_user_with_auth(
        'tecnico.vida@correseguros.co',
        'SGS123456',
        'Sandra Echeverri',
        'TECNICO',
        'SE'
    );
    RAISE NOTICE 'Usuario 4/13 creado: Sandra Echeverri (TECNICO)';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Usuario 4 ya existe o error: %', SQLERRM;
END $$;

-- 5. Gonzalo Duque Restrepo
DO $$
BEGIN
    PERFORM create_user_with_auth(
        'tecnico.jfaseguros@correseguros.co',
        'SGS123456',
        'Gonzalo Duque Restrepo',
        'TECNICO',
        'GDR'
    );
    RAISE NOTICE 'Usuario 5/13 creado: Gonzalo Duque Restrepo (TECNICO)';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Usuario 5 ya existe o error: %', SQLERRM;
END $$;

-- 6. Yobani Gomez
DO $$
BEGIN
    PERFORM create_user_with_auth(
        'asistente.jfaseguros@correseguros.co',
        'SGS123456',
        'Yobani Gomez',
        'TECNICO',
        'YG'
    );
    RAISE NOTICE 'Usuario 6/13 creado: Yobani Gomez (TECNICO)';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Usuario 6 ya existe o error: %', SQLERRM;
END $$;

-- =====================================
-- USUARIOS GERENTE (7)
-- =====================================

-- 7. Luz Elena
DO $$
BEGIN
    PERFORM create_user_with_auth(
        'elenacorreseguros@gmail.com',
        'SGS123456',
        'Luz Elena',
        'GERENTE',
        'LE'
    );
    RAISE NOTICE 'Usuario 7/13 creado: Luz Elena (GERENTE)';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Usuario 7 ya existe o error: %', SQLERRM;
END $$;

-- 8. Manuel Antonio Velasquez León
DO $$
BEGIN
    PERFORM create_user_with_auth(
        'gerencia.comercial@correseguros.co',
        'SGS123456',
        'Manuel Antonio Velasquez León',
        'GERENTE',
        'MAVL'
    );
    RAISE NOTICE 'Usuario 8/13 creado: Manuel Antonio Velasquez León (GERENTE)';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Usuario 8 ya existe o error: %', SQLERRM;
END $$;

-- 9. Carlos Enrique Vallejo
DO $$
BEGIN
    PERFORM create_user_with_auth(
        'carlosvallejo@seacompetitivo.com',
        'SGS123456',
        'Carlos Enrique Vallejo',
        'GERENTE',
        'CEV'
    );
    RAISE NOTICE 'Usuario 9/13 creado: Carlos Enrique Vallejo (GERENTE)';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Usuario 9 ya existe o error: %', SQLERRM;
END $$;

-- 10. Claudia Arbelaez
DO $$
BEGIN
    PERFORM create_user_with_auth(
        'procesosyproyectos@correseguros.co',
        'SGS123456',
        'Claudia Arbelaez',
        'GERENTE',
        'CA'
    );
    RAISE NOTICE 'Usuario 10/13 creado: Claudia Arbelaez (GERENTE)';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Usuario 10 ya existe o error: %', SQLERRM;
END $$;

-- 11. Luis Alberto Gallón
DO $$
BEGIN
    PERFORM create_user_with_auth(
        'director2jfaseguros@correseguros.co',
        'SGS123456',
        'Luis Alberto Gallón',
        'GERENTE',
        'LAG'
    );
    RAISE NOTICE 'Usuario 11/13 creado: Luis Alberto Gallón (GERENTE)';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Usuario 11 ya existe o error: %', SQLERRM;
END $$;

-- 12. Alejandro Uribe Velez
DO $$
BEGIN
    PERFORM create_user_with_auth(
        'auribe@uvseguros.com.co',
        'SGS123456',
        'Alejandro Uribe Velez',
        'GERENTE',
        'AUV'
    );
    RAISE NOTICE 'Usuario 12/13 creado: Alejandro Uribe Velez (GERENTE)';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Usuario 12 ya existe o error: %', SQLERRM;
END $$;

-- 13. Lisimaco Cifuentes
DO $$
BEGIN
    PERFORM create_user_with_auth(
        'lisimacocorreseguros@gmail.com',
        'SGS123456',
        'Lisimaco Cifuentes',
        'GERENTE',
        'LC'
    );
    RAISE NOTICE 'Usuario 13/13 creado: Lisimaco Cifuentes (GERENTE)';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Usuario 13 ya existe o error: %', SQLERRM;
END $$;

-- Reactivar triggers
ALTER TABLE auth.users ENABLE TRIGGER ALL;

-- ============================================================================
-- 12. VERIFICACIÓN FINAL
-- ============================================================================

SELECT '========================================' as separator;
SELECT 'ESQUEMA CREADO EXITOSAMENTE' as titulo;
SELECT '========================================' as separator;

SELECT 
    'Tablas creadas:' as info,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name IN ('claims', 'state_history', 'timeline', 'amparos', 'users', 'audit_logs')) as cantidad;

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

SELECT 
    'Funciones disponibles:' as info,
    proname as nombre
FROM pg_proc 
WHERE proname IN ('create_user_with_auth', 'log_audit_action', 'update_updated_at_column')
ORDER BY proname;

-- ============================================================================
-- 13. LISTADO COMPLETO DE USUARIOS
-- ============================================================================

SELECT 
    name,
    email,
    role,
    initials,
    is_active
FROM users
ORDER BY 
    CASE role 
        WHEN 'ADMIN' THEN 1 
        WHEN 'GERENTE' THEN 2 
        WHEN 'TECNICO' THEN 3 
        ELSE 4 
    END,
    name;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
