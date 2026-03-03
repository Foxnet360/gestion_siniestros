-- ============================================================================
-- SGS - CREAR SOLO TABLAS PÚBLICAS (Sin tocar auth.users)
-- Versión: 5.0
-- Fecha: 2026-03-02
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONES
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. TABLA CLAIMS
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
-- 3. TABLAS RELACIONADAS
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
-- 4. ÍNDICES
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
-- 5. FUNCIONES
-- ============================================================================

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
-- 6. RLS
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
-- 7. VERIFICACIÓN
-- ============================================================================

SELECT '========================================' as separator;
SELECT 'TABLAS CREADAS' as titulo;
SELECT '========================================' as separator;

SELECT 
    table_name as tabla,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t.table_name) THEN '✅ CREADA' ELSE '❌ ERROR' END as estado
FROM (VALUES ('claims'), ('state_history'), ('timeline'), ('amparos'), ('users'), ('audit_logs')) AS t(table_name);

SELECT '========================================' as separator;
SELECT '✅ Esquema listo. Ahora crea los usuarios manualmente desde el Dashboard.' as mensaje;
SELECT '========================================' as separator;
