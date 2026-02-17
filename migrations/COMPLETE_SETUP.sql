-- ============================================================================
-- COMPLETE DATABASE SETUP - ALL TABLES
-- Apply this in Supabase Dashboard → SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. CREATE CLAIMS TABLE (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS claims (
    id_softseguros TEXT PRIMARY KEY,
    id_interno TEXT,
    numero_siniestro TEXT,
    poliza TEXT,
    asegurado TEXT,
    estado_softseguros TEXT,
    estado_interno TEXT,
    usuario_registro TEXT,
    placa_bien TEXT,
    ramo TEXT,
    aseguradora TEXT,
    vendedor TEXT,
    tecnico_asignado TEXT,
    aliado_origen TEXT,
    prioridad TEXT,
    monto_reclamo NUMERIC,
    valor_deducible NUMERIC,
    valor_indemnizacion NUMERIC,
    fecha_ocurrencia TIMESTAMP,
    lastStateChangeDate TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT NOW(),
    
    -- NEW: 17 additional fields
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
    ultimo_seguimiento_raw TEXT,
    gestion_softseguros TEXT,
    estado_gestion_softseguros TEXT,
    prescripcion_ordinaria DATE,
    prescripcion_extraordinaria DATE,
    proximo_seguimiento TIMESTAMP
);

-- ============================================================================
-- 2. CREATE STATE_HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS state_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id TEXT NOT NULL,
    state TEXT NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    days_duration INTEGER,
    author TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_state_history_claim
        FOREIGN KEY (claim_id)
        REFERENCES claims(id_softseguros)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_state_history_claim_id ON state_history(claim_id);

-- ============================================================================
-- 3. CREATE TIMELINE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id TEXT NOT NULL,
    date TIMESTAMP NOT NULL,
    author TEXT NOT NULL,
    text TEXT NOT NULL,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_timeline_claim
        FOREIGN KEY (claim_id)
        REFERENCES claims(id_softseguros)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_timeline_claim_id ON timeline(claim_id);

-- ============================================================================
-- 4. CREATE AMPAROS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS amparos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id TEXT NOT NULL,
    numero_siniestro TEXT NOT NULL,
    nombre_reclamante TEXT NOT NULL,
    amparo TEXT NOT NULL,
    valor NUMERIC NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_amparos_claim
        FOREIGN KEY (claim_id)
        REFERENCES claims(id_softseguros)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_amparos_claim_id ON amparos(claim_id);
CREATE INDEX IF NOT EXISTS idx_amparos_composite_key ON amparos(claim_id, amparo, nombre_reclamante);

-- ============================================================================
-- 5. PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_claims_estado_softseguros ON claims(estado_softseguros);
CREATE INDEX IF NOT EXISTS idx_claims_aseguradora ON claims(aseguradora);
CREATE INDEX IF NOT EXISTS idx_claims_tecnico ON claims(tecnico_asignado);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- This creates ALL required tables with proper foreign keys
-- Run this entire script in Supabase Dashboard → SQL Editor
-- ============================================================================
