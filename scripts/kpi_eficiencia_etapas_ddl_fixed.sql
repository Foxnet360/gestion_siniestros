-- ============================================================================
-- KPI EFICIENCIA POR ETAPAS - MIGRACIÓN PASO A PASO
-- ============================================================================
-- Ejecutar cada sección por separado si hay errores
-- ============================================================================

-- ============================================================================
-- PASO 1: Crear tablas (ejecutar primero)
-- ============================================================================

-- Tabla: sla_por_etapa
CREATE TABLE IF NOT EXISTS sla_por_etapa (
    etapa_num INTEGER PRIMARY KEY,
    etapa_nombre VARCHAR(100) NOT NULL,
    dias_sla INTEGER,
    frecuencia_seguimiento INTEGER,
    descripcion TEXT,
    aplica_prescripcion BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla: feriados_colombia
CREATE TABLE IF NOT EXISTS feriados_colombia (
    fecha DATE PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50),
    es_puente BOOLEAN DEFAULT FALSE,
    anio INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Verificar que las tablas existen
SELECT 'Tablas creadas:' as paso, 
       table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('sla_por_etapa', 'feriados_colombia');

-- ============================================================================
-- PASO 2: Poblar SLA por etapa (ejecutar después de crear tablas)
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
-- PASO 3: Poblar feriados 2024 (ejecutar después del paso 2)
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
-- PASO 4: Poblar feriados 2025 (ejecutar después del paso 3)
-- ============================================================================

-- NOTA: En 2025, Sagrado Corazón y San Pedro y San Pablo caen el mismo día (30 de junio)
-- Se combinan en una sola entrada para evitar duplicados

INSERT INTO feriados_colombia (fecha, nombre, tipo, es_puente, anio) VALUES
('2025-01-01', 'Año Nuevo', 'civil', FALSE, 2025),
('2025-01-06', 'Día de los Reyes Magos', 'religioso', FALSE, 2025),
('2025-03-24', 'Día de San José', 'religioso', TRUE, 2025),
('2025-04-17', 'Jueves Santo', 'religioso', FALSE, 2025),
('2025-04-18', 'Viernes Santo', 'religioso', FALSE, 2025),
('2025-05-01', 'Día del Trabajo', 'civil', FALSE, 2025),
('2025-06-02', 'Día de la Ascensión', 'religioso', TRUE, 2025),
('2025-06-23', 'Corpus Christi', 'religioso', TRUE, 2025),
('2025-06-30', 'Sagrado Corazón y San Pedro y San Pablo', 'religioso', TRUE, 2025),
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
-- VERIFICACIÓN FINAL
-- ============================================================================

SELECT 
    'SLAs definidos' as item,
    COUNT(*) as total 
FROM sla_por_etapa;

SELECT 
    'Feriados 2024' as item,
    COUNT(*) as total 
FROM feriados_colombia 
WHERE anio = 2024;

SELECT 
    'Feriados 2025' as item,
    COUNT(*) as total 
FROM feriados_colombia 
WHERE anio = 2025;

-- Verificar que no hay duplicados
SELECT 
    'Duplicados' as item,
    COUNT(*) as total 
FROM (
    SELECT fecha, COUNT(*) as cnt 
    FROM feriados_colombia 
    GROUP BY fecha 
    HAVING COUNT(*) > 1
) t;

-- ============================================================================
-- NOTAS
-- ============================================================================
-- 
-- ✅ Este script está dividido en pasos para facilitar la depuración
-- ✅ Si hay errores, ejecutar cada sección (PASO 1, 2, 3, 4) por separado
-- ✅ El feriado del 30 de junio 2025 combina dos festividades
--
-- Próximo paso: Ejecutar scripts de procesamiento de métricas
-- ============================================================================
