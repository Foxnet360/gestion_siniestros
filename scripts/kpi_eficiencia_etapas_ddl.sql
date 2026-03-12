-- ============================================================================
-- KPI EFICIENCIA POR ETAPAS - FASE 1: DDL Y ESTRUCTURA BASE
-- ============================================================================
-- Crear tablas necesarias para el sistema de métricas por etapas
-- Fecha: 2024
-- ============================================================================

-- ============================================================================
-- 1.1 TABLA: sla_por_etapa
-- Definición de SLAs y frecuencias esperadas para cada etapa
-- ============================================================================

CREATE TABLE IF NOT EXISTS sla_por_etapa (
    etapa_num INTEGER PRIMARY KEY,
    etapa_nombre VARCHAR(100) NOT NULL,
    dias_sla INTEGER,                    -- SLA en días hábiles (NULL = no aplica)
    frecuencia_seguimiento INTEGER,      -- Cada cuántos días debe haber seguimiento
    descripcion TEXT,
    aplica_prescripcion BOOLEAN DEFAULT FALSE,  -- ¿Aplica para procesos en prescripción?
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE sla_por_etapa IS 'Definición de SLAs y frecuencias de seguimiento por etapa del proceso de siniestros';

-- ============================================================================
-- 1.2 TABLA: metricas_etapas
-- Almacena métricas calculadas por etapa para cada siniestro
-- ============================================================================

CREATE TABLE IF NOT EXISTS metricas_etapas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id VARCHAR NOT NULL REFERENCES claims(id_softseguros),
    
    -- Identificación de etapa
    etapa_num INTEGER NOT NULL,
    fecha_entrada DATE NOT NULL,
    fecha_salida DATE,
    
    -- Métricas de tiempo
    dias_habiles INTEGER,                -- Días hábiles en la etapa (excluye fines de semana y feriados)
    dias_calendario INTEGER,             -- Días calendario totales
    
    -- Métricas de seguimiento
    cantidad_seguimientos INTEGER DEFAULT 0,
    primera_fecha_seguimiento DATE,
    ultima_fecha_seguimiento DATE,
    frecuencia_dias DECIMAL(5,2),        -- Promedio de días entre seguimientos
    
    -- SLA
    dias_sla INTEGER,                    -- SLA definido para esta etapa
    cumple_sla BOOLEAN,                  -- TRUE/FALSE/NULL
    desviacion_sla INTEGER,              -- Días de desviación (positivo = excedió, negativo = bajo SLA)
    
    -- Conversión
    paso_a_siguiente_etapa BOOLEAN DEFAULT TRUE,
    etapa_siguiente INTEGER,
    
    -- Calidad de datos
    datos_completos BOOLEAN DEFAULT TRUE,
    razon_incompleto VARCHAR(100),       -- 'sin_etapa_1', 'sin_etapa_16', 'datos_insuficientes'
    notas_calidad TEXT,
    
    -- Segmentación
    aseguradora_id VARCHAR,
    ramo_id VARCHAR,
    tecnico_id VARCHAR,
    tipo_proceso VARCHAR(50),            -- 'normal', 'prescripcion_ordinaria', 'prescripcion_extraordinaria', 'incompleto'
    rango_valor VARCHAR(50),             -- '0-5M', '5M-20M', '>20M'
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraint único para evitar duplicados
    UNIQUE(claim_id, etapa_num)
);

COMMENT ON TABLE metricas_etapas IS 'Métricas calculadas por etapa para cada siniestro (tiempos, frecuencia, SLA)';

-- ============================================================================
-- 1.3 TABLA: seguimientos_procesados
-- Almacena seguimientos extraídos de claim_history para análisis
-- ============================================================================

CREATE TABLE IF NOT EXISTS seguimientos_procesados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id VARCHAR NOT NULL REFERENCES claims(id_softseguros),
    fecha TIMESTAMP NOT NULL,
    observaciones TEXT,
    estado_softseguros VARCHAR(200),
    estado_interno VARCHAR(200),
    etapa_detectada INTEGER,             -- IA o parsing detecta la etapa
    usuario_id VARCHAR,                  -- Quién hizo el seguimiento
    
    -- Campos calculados
    dias_desde_ultimo INTEGER,           -- Días desde el seguimiento anterior
    es_seguimiento_programado BOOLEAN,   -- ¿Coincide con fecha_proximo_seguimiento?
    
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE seguimientos_procesados IS 'Seguimientos extraídos de claim_history para cálculo de frecuencias';

-- ============================================================================
-- 1.4 TABLA: kpis_etapas_agregados
-- Caché de métricas agregadas para consultas rápidas
-- ============================================================================

CREATE TABLE IF NOT EXISTS kpis_etapas_agregados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Filtros aplicados (NULL = todos)
    periodo_inicio DATE,
    periodo_fin DATE,
    aseguradora_id VARCHAR,
    ramo_id VARCHAR,
    tecnico_id VARCHAR,
    tipo_proceso VARCHAR(50),
    
    -- Resumen
    total_siniestros INTEGER DEFAULT 0,
    excluidos_incompletos INTEGER DEFAULT 0,
    porcentaje_completos DECIMAL(5,2),
    
    -- Lead Time Total
    lead_time_avg DECIMAL(8,2),
    lead_time_p50 DECIMAL(8,2),
    lead_time_p90 DECIMAL(8,2),
    lead_time_min INTEGER,
    lead_time_max INTEGER,
    
    -- Métricas por etapa (JSON para flexibilidad)
    metricas_por_etapa JSONB,
    
    -- Cuellos de botella identificados
    cuellos_de_botella JSONB,
    
    -- Metadata
    calculado_en TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,                -- TTL para caché
    
    -- Constraint único por combinación de filtros
    UNIQUE(periodo_inicio, periodo_fin, aseguradora_id, ramo_id, tecnico_id, tipo_proceso)
);

COMMENT ON TABLE kpis_etapas_agregados IS 'Caché de métricas agregadas para consultas rápidas del dashboard';

-- ============================================================================
-- 1.5 TABLA: feriados_colombia
-- Calendario de feriados nacionales de Colombia
-- ============================================================================

CREATE TABLE IF NOT EXISTS feriados_colombia (
    fecha DATE PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50),                    -- 'nacional', 'religioso', 'civil', 'puente'
    es_puente BOOLEAN DEFAULT FALSE,
    anio INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE feriados_colombia IS 'Feriados nacionales de Colombia para cálculo de días hábiles';

-- ============================================================================
-- 1.6 ÍNDICES
-- Crear índices para optimizar consultas frecuentes
-- ============================================================================

-- Índices para metricas_etapas
CREATE INDEX IF NOT EXISTS idx_metricas_etapas_claim 
ON metricas_etapas(claim_id);

CREATE INDEX IF NOT EXISTS idx_metricas_etapas_etapa 
ON metricas_etapas(etapa_num);

CREATE INDEX IF NOT EXISTS idx_metricas_etapas_tipo 
ON metricas_etapas(tipo_proceso);

CREATE INDEX IF NOT EXISTS idx_metricas_etapas_completos 
ON metricas_etapas(datos_completos) 
WHERE datos_completos = TRUE;

CREATE INDEX IF NOT EXISTS idx_metricas_etapas_aseguradora 
ON metricas_etapas(aseguradora_id);

CREATE INDEX IF NOT EXISTS idx_metricas_etapas_ramo 
ON metricas_etapas(ramo_id);

CREATE INDEX IF NOT EXISTS idx_metricas_etapas_tecnico 
ON metricas_etapas(tecnico_id);

CREATE INDEX IF NOT EXISTS idx_metricas_etapas_cumple_sla 
ON metricas_etapas(cumple_sla) 
WHERE cumple_sla = FALSE;

CREATE INDEX IF NOT EXISTS idx_metricas_etapas_entrada 
ON metricas_etapas(fecha_entrada);

-- Índices para seguimientos_procesados
CREATE INDEX IF NOT EXISTS idx_seguimientos_claim 
ON seguimientos_procesados(claim_id);

CREATE INDEX IF NOT EXISTS idx_seguimientos_fecha 
ON seguimientos_procesados(fecha);

CREATE INDEX IF NOT EXISTS idx_seguimientos_etapa 
ON seguimientos_procesados(etapa_detectada);

-- Índices para kpis_etapas_agregados
CREATE INDEX IF NOT EXISTS idx_kpis_periodo 
ON kpis_etapas_agregados(periodo_inicio, periodo_fin);

CREATE INDEX IF NOT EXISTS idx_kpis_tipo 
ON kpis_etapas_agregados(tipo_proceso);

CREATE INDEX IF NOT EXISTS idx_kpis_expires 
ON kpis_etapas_agregados(expires_at);

-- Índices para feriados_colombia
CREATE INDEX IF NOT EXISTS idx_feriados_anio 
ON feriados_colombia(anio);

-- ============================================================================
-- 1.7 POBLAR sla_por_etapa
-- Insertar definiciones de SLAs para las 16 etapas
-- ============================================================================

INSERT INTO sla_por_etapa (etapa_num, etapa_nombre, dias_sla, frecuencia_seguimiento, descripcion, aplica_prescripcion) VALUES
(1, 'Aviso Siniestro', NULL, NULL, 'Etapa inicial del proceso. No tiene SLA definido.', FALSE),
(2, 'Radicación Compañía', 5, 5, 'Tiempo máximo para radicar el siniestro en la compañía aseguradora.', FALSE),
(3, 'Ajustador', 10, 5, 'Asignación y trabajo del ajustador. Incluye inspección inicial.', FALSE),
(4, 'Documentos Adicionales', 7, 3, 'Solicitud y recepción de documentación adicional requerida.', FALSE),
(5, 'Asistencia', 5, 3, 'Coordinación de servicios de asistencia si aplica.', FALSE),
(6, 'Liquidación', 10, 5, 'Elaboración y revisión de la liquidación del siniestro.', FALSE),
(7, 'Objeción', 15, 5, 'Tiempo para resolver objeciones presentadas por la aseguradora.', FALSE),
(8, 'Reconsideración Liquidación', 10, 5, 'Revisión de liquidación tras objeción resuelta.', FALSE),
(9, 'Reconsideración Objeción', 15, 5, 'Segunda revisión si persiste objeción.', FALSE),
(10, 'Desistimiento', NULL, NULL, 'Tiempo variable según el caso.', FALSE),
(11, 'Ratificación Liquidación', 5, 3, 'Aprobación final de la liquidación por todas las partes.', FALSE),
(12, 'Ratificación Objeción', 5, 3, 'Aprobación final tras reconsideración.', FALSE),
(13, 'Prescripción', 730, 90, 'Período de espera para prescripción ordinaria (2 años). Seguimiento cada 90 días.', TRUE),
(14, 'Proceso Jurídico', NULL, 30, 'Procesos legales asociados. Seguimiento mensual.', FALSE),
(15, 'Finalizado', 3, 1, 'Preparación de documentos para pago.', FALSE),
(16, 'Pagado', NULL, NULL, 'Etapa final. Pago realizado.', FALSE)
ON CONFLICT (etapa_num) DO UPDATE SET
    etapa_nombre = EXCLUDED.etapa_nombre,
    dias_sla = EXCLUDED.dias_sla,
    frecuencia_seguimiento = EXCLUDED.frecuencia_seguimiento,
    descripcion = EXCLUDED.descripcion,
    aplica_prescripcion = EXCLUDED.aplica_prescripcion,
    updated_at = NOW();

-- ============================================================================
-- 1.8 POBLAR feriados_colombia
-- Feriados nacionales 2024
-- ============================================================================

INSERT INTO feriados_colombia (fecha, nombre, tipo, es_puente, anio) VALUES
('2024-01-01', 'Año Nuevo', 'civil', FALSE, 2024),
('2024-01-08', 'Día de los Reyes Magos', 'religioso', TRUE, 2024),
('2024-03-25', 'Día de San José', 'religioso', TRUE, 2024),
('2024-03-28', 'Jueves Santo', 'religioso', FALSE, 2024),
('2024-03-29', 'Viernes Santo', 'religioso', FALSE, 2024),
('2024-05-01', 'Día del Trabajo', 'civil', FALSE, 2024),
('2024-05-13', 'Día de la Ascensión', 'religioso', TRUE, 2024),
('2024-06-03', 'Corpus Christi', 'religioso', TRUE, 2024),
('2024-06-10', 'Sagrado Corazón', 'religioso', TRUE, 2024),
('2024-07-01', 'Día de San Pedro y San Pablo', 'religioso', TRUE, 2024),
('2024-07-20', 'Día de la Independencia', 'civil', FALSE, 2024),
('2024-08-07', 'Batalla de Boyacá', 'civil', FALSE, 2024),
('2024-08-19', 'La Asunción de la Virgen', 'religioso', TRUE, 2024),
('2024-10-14', 'Día de la Raza', 'civil', TRUE, 2024),
('2024-11-04', 'Todos los Santos', 'religioso', TRUE, 2024),
('2024-11-11', 'Independencia de Cartagena', 'civil', FALSE, 2024),
('2024-12-08', 'Día de la Inmaculada Concepción', 'religioso', FALSE, 2024),
('2024-12-25', 'Navidad', 'religioso', FALSE, 2024)
ON CONFLICT (fecha) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    tipo = EXCLUDED.tipo,
    es_puente = EXCLUDED.es_puente,
    anio = EXCLUDED.anio;

-- ============================================================================
-- 1.9 POBLAR feriados_colombia
-- Feriados nacionales 2025
-- ============================================================================

INSERT INTO feriados_colombia (fecha, nombre, tipo, es_puente, anio) VALUES
('2025-01-01', 'Año Nuevo', 'civil', FALSE, 2025),
('2025-01-06', 'Día de los Reyes Magos', 'religioso', FALSE, 2025),
('2025-03-24', 'Día de San José', 'religioso', TRUE, 2025),
('2025-04-17', 'Jueves Santo', 'religioso', FALSE, 2025),
('2025-04-18', 'Viernes Santo', 'religioso', FALSE, 2025),
('2025-05-01', 'Día del Trabajo', 'civil', FALSE, 2025),
('2025-06-02', 'Día de la Ascensión', 'religioso', TRUE, 2025),
('2025-06-23', 'Corpus Christi', 'religioso', TRUE, 2025),
('2025-06-30', 'Sagrado Corazón / San Pedro y San Pablo', 'religioso', TRUE, 2025),
('2025-07-20', 'Día de la Independencia', 'civil', FALSE, 2025),
('2025-08-07', 'Batalla de Boyacá', 'civil', FALSE, 2025),
('2025-08-18', 'La Asunción de la Virgen', 'religioso', TRUE, 2025),
('2025-10-13', 'Día de la Raza', 'civil', TRUE, 2025),
('2025-11-03', 'Todos los Santos', 'religioso', TRUE, 2025),
('2025-11-17', 'Independencia de Cartagena', 'civil', TRUE, 2025),
('2025-12-08', 'Día de la Inmaculada Concepción', 'religioso', FALSE, 2025),
('2025-12-25', 'Navidad', 'religioso', FALSE, 2025)
ON CONFLICT (fecha) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    tipo = EXCLUDED.tipo,
    es_puente = EXCLUDED.es_puente,
    anio = EXCLUDED.anio;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar tablas creadas
SELECT 'Tablas creadas:' as verificacion;
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columnas
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('sla_por_etapa', 'metricas_etapas', 'seguimientos_procesados', 'kpis_etapas_agregados', 'feriados_colombia')
ORDER BY table_name;

-- Verificar datos iniciales
SELECT 'SLAs definidos:' as verificacion, COUNT(*) as total FROM sla_por_etapa;
SELECT 'Feriados 2024:' as verificacion, COUNT(*) as total FROM feriados_colombia WHERE anio = 2024;
SELECT 'Feriados 2025:' as verificacion, COUNT(*) as total FROM feriados_colombia WHERE anio = 2025;

-- ============================================================================
-- NOTAS
-- ============================================================================
-- 
-- ✅ Este script es idempotent (puede ejecutarse múltiples veces sin errores)
-- ✅ Usa IF NOT EXISTS y ON CONFLICT para evitar duplicados
-- ✅ Incluye todos los feriados colombianos 2024-2025
-- ✅ SLAs definidos para 16 etapas del proceso
--
-- Próximo paso: Ejecutar scripts de procesamiento de métricas
-- ============================================================================
