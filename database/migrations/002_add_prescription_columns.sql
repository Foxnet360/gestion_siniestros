-- Migration: Add prescription and alert columns to claims table
-- Created: 2026-03-06

-- Add new columns for prescription management and alerts
ALTER TABLE claims 
    ADD COLUMN IF NOT EXISTS alert_level VARCHAR(20) DEFAULT 'normal',
    ADD COLUMN IF NOT EXISTS fecha_prescripcion_ordinaria DATE,
    ADD COLUMN IF NOT EXISTS fecha_prescripcion_extraordinaria DATE;

-- Add comment on columns
COMMENT ON COLUMN claims.alert_level IS 'Nivel de alerta: normal, warning, critical, legal_stagnation_warning, legal_stagnation_critical';
COMMENT ON COLUMN claims.fecha_prescripcion_ordinaria IS 'Fecha de prescripción ordinaria (2 años desde fecha_ocurrencia)';
COMMENT ON COLUMN claims.fecha_prescripcion_extraordinaria IS 'Fecha de prescripción extraordinaria (5 años para RC)';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_claims_fecha_prescripcion_ordinaria 
    ON claims(fecha_prescripcion_ordinaria) 
    WHERE fecha_prescripcion_ordinaria IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_claims_fecha_prescripcion_extraordinaria 
    ON claims(fecha_prescripcion_extraordinaria) 
    WHERE fecha_prescripcion_extraordinaria IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_claims_alert_level_estado 
    ON claims(alert_level, estado_interno) 
    WHERE alert_level IN ('warning', 'critical', 'legal_stagnation_warning', 'legal_stagnation_critical');

CREATE INDEX IF NOT EXISTS idx_claims_proximo_seguimiento_estado 
    ON claims(proximo_seguimiento, estado_interno) 
    WHERE estado_interno NOT IN ('FINALIZADO', 'PAGADO') AND finalizado = false;

-- Create composite index for alert queries
CREATE INDEX IF NOT EXISTS idx_claims_alert_queries 
    ON claims(alert_level, fecha_prescripcion_ordinaria, fecha_prescripcion_extraordinaria) 
    WHERE estado_interno NOT IN ('FINALIZADO', 'PAGADO');

-- Create index for legal stagnation queries
CREATE INDEX IF NOT EXISTS idx_claims_legal_stagnation 
    ON claims(estado_interno, lastStateChangeDate) 
    WHERE estado_interno = 'PROCESO JURÍDICO';
