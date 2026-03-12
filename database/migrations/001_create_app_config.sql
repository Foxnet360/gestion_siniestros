-- Migration: Create app_config table for configurable business rules
-- Created: 2026-03-06

-- Table for storing configurable business rules
CREATE TABLE IF NOT EXISTS app_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(100)
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_app_config_key ON app_config(config_key);
CREATE INDEX IF NOT EXISTS idx_app_config_updated_at ON app_config(updated_at);

-- Insert initial configuration records
INSERT INTO app_config (config_key, config_value, description) VALUES
('follow_up_rules', '{
    "standard": {
        "phases": [1, 2, 3, 4, 5],
        "days": 10,
        "description": "Seguimiento cada 10 días para fases 1-5"
    },
    "legal": {
        "state": "PROCESO JURÍDICO",
        "minDays": 30,
        "maxDays": 60,
        "defaultDays": 30,
        "description": "1-2 meses según situación del cliente"
    },
    "prescription": {
        "state": "PRESCRIPCIÓN",
        "days": 10,
        "description": "Revisión cada 10 días hasta cierre"
    }
}'::jsonb, 'Reglas de cálculo de próximo seguimiento'),

('prescription_rules', '{
    "ordinary": {
        "years": 2,
        "description": "Prescripción ordinaria - 2 años desde fecha de ocurrencia",
        "excludes": ["Responsabilidad Civil"]
    },
    "extraordinary": {
        "years": 5,
        "description": "Prescripción extraordinaria - 5 años para RC y eventos sin conocer",
        "includes": ["Responsabilidad Civil"]
    }
}'::jsonb, 'Reglas de prescripción por tipo de siniestro'),

('alert_thresholds', '{
    "prescription": {
        "warning": 90,
        "critical": 30,
        "autoClose": 0,
        "description": "Días antes de vencimiento para alertas"
    },
    "followUp": {
        "overdue": 1,
        "stagnant": 30,
        "description": "Días de atraso para seguimientos"
    },
    "legalStagnant": {
        "warningMonths": 24,
        "closeYears": 5,
        "description": "Meses/años para alertas y cierre por estancamiento"
    }
}'::jsonb, 'Umbrales para alertas y cierres automáticos'),

('notification_settings', '{
    "ui": true,
    "email": true,
    "dailyDigest": true,
    "digestTime": "08:00",
    "criticalOverride": true,
    "description": "Configuración de canales de notificación"
}'::jsonb, 'Configuración de notificaciones'),

('auto_close_rules', '{
    "highValueThreshold": 50000000,
    "highPriorityExclusion": ["ALTA"],
    "autoCloseStates": ["PRESCRIPCIÓN"],
    "pendingApprovalState": "CIERRE PENDIENTE APROBACIÓN",
    "description": "Reglas para cierre automático"
}'::jsonb, 'Reglas de cierre automático');

-- Enable RLS on app_config
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Policy: Only ADMIN can modify configuration
CREATE POLICY "Allow ADMIN full access to app_config"
    ON app_config
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'ADMIN')
    WITH CHECK (auth.jwt() ->> 'role' = 'ADMIN');

-- Policy: All authenticated users can read configuration
CREATE POLICY "Allow authenticated users to read app_config"
    ON app_config
    FOR SELECT
    TO authenticated
    USING (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_app_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_app_config_updated_at
    BEFORE UPDATE ON app_config
    FOR EACH ROW
    EXECUTE FUNCTION update_app_config_updated_at();

COMMENT ON TABLE app_config IS 'Tabla de configuración de reglas de negocio';
COMMENT ON COLUMN app_config.config_key IS 'Clave única de la configuración';
COMMENT ON COLUMN app_config.config_value IS 'Valor de configuración en formato JSONB';
