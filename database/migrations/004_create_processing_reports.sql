-- Migration: Create processing_reports table for Edge Function logging
-- Created: 2026-03-07

CREATE TABLE IF NOT EXISTS processing_reports (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER NOT NULL, -- milliseconds
    
    -- Alert evaluation stats
    alerts_evaluated INTEGER NOT NULL DEFAULT 0,
    alerts_updated INTEGER NOT NULL DEFAULT 0,
    
    -- Prescription closure stats
    closures_auto INTEGER NOT NULL DEFAULT 0,
    closures_pending INTEGER NOT NULL DEFAULT 0,
    
    -- Legal stagnation stats
    stagnation_warnings INTEGER NOT NULL DEFAULT 0,
    stagnation_closed INTEGER NOT NULL DEFAULT 0,
    
    -- Email notification stats
    emails_critical INTEGER NOT NULL DEFAULT 0,
    emails_digests INTEGER NOT NULL DEFAULT 0,
    
    -- Error tracking
    total_errors INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_processing_reports_timestamp 
    ON processing_reports(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_processing_reports_date 
    ON processing_reports(DATE(timestamp) DESC);

-- Enable RLS
ALTER TABLE processing_reports ENABLE ROW LEVEL SECURITY;

-- Only ADMIN and GERENTE can view reports
CREATE POLICY "Allow ADMIN and GERENTE to view processing reports"
    ON processing_reports
    FOR SELECT
    TO authenticated
    USING (auth.jwt() ->> 'role' IN ('ADMIN', 'GERENTE'));

-- No one can modify reports (they are insert-only from Edge Function)
CREATE POLICY "No modifications allowed on processing reports"
    ON processing_reports
    FOR ALL
    TO authenticated
    USING (false)
    WITH CHECK (false);

-- Add comment
COMMENT ON TABLE processing_reports IS 'Registros de ejecución de la Edge Function de procesamiento diario';
COMMENT ON COLUMN processing_reports.alerts_evaluated IS 'Número de siniestros evaluados para alertas';
COMMENT ON COLUMN processing_reports.closures_auto IS 'Número de cierres automáticos realizados';
COMMENT ON COLUMN processing_reports.stagnation_warnings IS 'Número de alertas de estancamiento generadas';
COMMENT ON COLUMN processing_reports.total_errors IS 'Número total de errores durante el procesamiento';

-- Create view for daily summary
CREATE OR REPLACE VIEW daily_processing_summary AS
SELECT 
    DATE(timestamp) as fecha,
    COUNT(*) as total_ejecuciones,
    SUM(CASE WHEN total_errors = 0 THEN 1 ELSE 0 END) as exitosas,
    SUM(CASE WHEN total_errors > 0 THEN 1 ELSE 0 END) as con_errores,
    AVG(duration) as duracion_promedio_ms,
    SUM(alerts_updated) as total_alertas_actualizadas,
    SUM(closures_auto) as total_cierres_automaticos,
    SUM(closures_pending) as total_pendientes_aprobacion,
    SUM(stagnation_warnings) as total_alertas_estancamiento,
    SUM(stagnation_closed) as total_cierres_estancamiento,
    SUM(emails_critical) as total_emails_criticos,
    SUM(emails_digests) as total_resumenes_enviados,
    SUM(total_errors) as total_errores
FROM processing_reports
GROUP BY DATE(timestamp)
ORDER BY fecha DESC;

COMMENT ON VIEW daily_processing_summary IS 'Resumen diario de ejecuciones del procesamiento automático';
