-- ============================================================================
-- GENERACIÓN DE DATOS DE PRUEBA PARA SGS - KPI DASHBOARD
-- Período: Marzo 2025 - Marzo 2026 (1 año)
-- Total: 120 siniestros con distribución KPI específica
-- ============================================================================

-- ============================================================================
-- 11.1 TABLA DE RAMOS (8 ramos de seguro)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ramos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insertar 8 ramos
INSERT INTO ramos (codigo, nombre, descripcion) VALUES
    ('AUTO', 'Automóviles', 'Seguros de vehículos automotores'),
    ('VIDA', 'Vida', 'Seguros de vida individual y colectivos'),
    ('INCN', 'Incendio', 'Seguros contra incendio y riesgos aliados'),
    ('CUMP', 'Cumplimiento', 'Seguros de cumplimiento y garantías'),
    ('RCE', 'Responsabilidad Civil', 'Responsabilidad civil empresarial y profesional'),
    ('SALUD', 'Salud', 'Seguros de salud y medicina prepagada'),
    ('HOGAR', 'Hogar', 'Seguros de hogar y contenidos'),
    ('TRANS', 'Transporte', 'Seguros de transporte de mercancías')
ON CONFLICT (codigo) DO NOTHING;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_ramos_activo ON ramos(activo);

-- ============================================================================
-- 11.2 GENERACIÓN DE 120 SINIESTROS (claims)
-- Distribución KPI:
-- - Lead Time normal: 102 siniestros (85%)
-- - Lead Time >30 días: 18 siniestros (15%)
-- - Desistimiento: 10 siniestros (8%)
-- - Objetados: 14 siniestros (12%)
-- - Backlog activo: 23 siniestros (19%)
-- ============================================================================

-- Primero, eliminar datos de prueba existentes (opcional, comentar si no se desea)
-- DELETE FROM amparos WHERE claim_id LIKE 'TEST-%';
-- DELETE FROM state_history WHERE claim_id LIKE 'TEST-%';
-- DELETE FROM timeline WHERE claim_id LIKE 'TEST-%';
-- DELETE FROM siniestro_etapas WHERE claim_id LIKE 'TEST-%';
-- DELETE FROM claims WHERE id_softseguros LIKE 'TEST-%';

-- Generar 120 siniestros distribuidos en 12 meses
INSERT INTO claims (
    id_softseguros,
    numero_siniestro,
    id_interno,
    poliza,
    asegurado,
    documento_asegurado,
    email_principal,
    celular_principal,
    placa_bien,
    ramo,
    aseguradora,
    vendedor,
    tecnico_asignado,
    tecnico_id,
    aliado_origen,
    estado_softseguros,
    estado_interno,
    prioridad,
    monto_reclamo,
    valor_deducible,
    valor_indemnizacion,
    fecha_ocurrencia,
    fecha_aviso,
    fecha_notificacion_aseguradora,
    tipo_siniestro,
    descripcion,
    finalizado,
    prescripcion_ordinaria,
    prescripcion_extraordinaria,
    porcentaje_siniestralidad,
    usuario_registro,
    ultimo_seguimiento_raw,
    created_at
)
SELECT 
    'TEST-' || LPAD(seq::TEXT, 4, '0') as id_softseguros,
    'SIN-' || TO_CHAR(fecha_base, 'YYYY') || '-' || LPAD(seq::TEXT, 4, '0') as numero_siniestro,
    'INT-' || LPAD(seq::TEXT, 4, '0') as id_interno,
    CASE 
        WHEN ramo_nombre = 'Automóviles' THEN 'POL-AUTO-' || LPAD((seq % 1000)::TEXT, 4, '0')
        WHEN ramo_nombre = 'Vida' THEN 'POL-VIDA-' || LPAD((seq % 1000)::TEXT, 4, '0')
        WHEN ramo_nombre = 'Incendio' THEN 'POL-INC-' || LPAD((seq % 1000)::TEXT, 4, '0')
        WHEN ramo_nombre = 'Cumplimiento' THEN 'POL-CUMP-' || LPAD((seq % 1000)::TEXT, 4, '0')
        WHEN ramo_nombre = 'Responsabilidad Civil' THEN 'POL-RCE-' || LPAD((seq % 1000)::TEXT, 4, '0')
        WHEN ramo_nombre = 'Salud' THEN 'POL-SAL-' || LPAD((seq % 1000)::TEXT, 4, '0')
        WHEN ramo_nombre = 'Hogar' THEN 'POL-HOG-' || LPAD((seq % 1000)::TEXT, 4, '0')
        ELSE 'POL-TRANS-' || LPAD((seq % 1000)::TEXT, 4, '0')
    END as poliza,
    nombre_asegurado,
    LPAD((10000000 + seq)::TEXT, 10, '0') as documento_asegurado,
    'asegurado' || seq || '@email.com' as email_principal,
    '300' || LPAD((1000000 + seq)::TEXT, 7, '0') as celular_principal,
    CASE 
        WHEN ramo_nombre = 'Automóviles' THEN 'ABC-' || LPAD(seq::TEXT, 3, '0')
        WHEN ramo_nombre = 'Hogar' THEN 'APTO ' || (seq % 500)
        ELSE 'N/A'
    END as placa_bien,
    ramo_nombre as ramo,
    aseguradora_nombre as aseguradora,
    vendedor_nombre as vendedor,
    tecnico_nombre as tecnico_asignado,
    tecnico_uuid as tecnico_id,
    aseguradora_nombre as aliado_origen,
    'ABIERTO' as estado_softseguros,
    estado_interno_val as estado_interno,
    CASE 
        WHEN seq % 3 = 0 THEN 'ALTA'
        WHEN seq % 3 = 1 THEN 'MEDIA'
        ELSE 'BAJA'
    END as prioridad,
    monto as monto_reclamo,
    ROUND(monto * 0.1)::NUMERIC as valor_deducible,
    CASE 
        WHEN finalizado_val THEN ROUND(monto * 0.85)::NUMERIC
        ELSE 0
    END as valor_indemnizacion,
    fecha_base as fecha_ocurrencia,
    fecha_aviso as fecha_aviso,
    fecha_notif as fecha_notificacion_aseguradora,
    tipo_sin as tipo_siniestro,
    desc_sin as descripcion,
    finalizado_val as finalizado,
    (fecha_base + INTERVAL '2 years')::DATE as prescripcion_ordinaria,
    (fecha_base + INTERVAL '5 years')::DATE as prescripcion_extraordinaria,
    (5 + (seq % 15))::NUMERIC as porcentaje_siniestralidad,
    'sistema_importacion' as usuario_registro,
    'Siniestro importado desde datos de prueba' as ultimo_seguimiento_raw,
    NOW() as created_at
FROM (
    SELECT 
        seq,
        -- Fecha base distribuida en 12 meses (marzo 2025 a marzo 2026)
        DATE '2025-03-01' + ((seq - 1) % 365) * INTERVAL '1 day' as fecha_base,
        -- Aseguradoras (5 distribuidas)
        CASE (seq % 5)
            WHEN 0 THEN 'Seguros Bolívar'
            WHEN 1 THEN 'Sura'
            WHEN 2 THEN 'AXA Colpatria'
            WHEN 3 THEN 'Allianz'
            ELSE 'Chubb'
        END as aseguradora_nombre,
        -- Ramos (8 distribuidos)
        CASE (seq % 8)
            WHEN 0 THEN 'Automóviles'
            WHEN 1 THEN 'Vida'
            WHEN 2 THEN 'Incendio'
            WHEN 3 THEN 'Cumplimiento'
            WHEN 4 THEN 'Responsabilidad Civil'
            WHEN 5 THEN 'Salud'
            WHEN 6 THEN 'Hogar'
            ELSE 'Transporte'
        END as ramo_nombre,
        -- Técnicos (de los 13 usuarios existentes)
        CASE (seq % 4)
            WHEN 0 THEN 'Sara Lucía Bedoya Velásquez'
            WHEN 1 THEN 'Sandra Echeverri'
            WHEN 2 THEN 'Gonzalo Duque Restrepo'
            ELSE 'Yobani Gomez'
        END as tecnico_nombre,
        -- IDs de técnicos existentes
        CASE (seq % 4)
            WHEN 0 THEN (SELECT id FROM users WHERE email = 'indemnizaciones1@correseguros.co')
            WHEN 1 THEN (SELECT id FROM users WHERE email = 'tecnico.vida@correseguros.co')
            WHEN 2 THEN (SELECT id FROM users WHERE email = 'tecnico.jfaseguros@correseguros.co')
            ELSE (SELECT id FROM users WHERE email = 'asistente.jfaseguros@correseguros.co')
        END as tecnico_uuid,
        -- Nombres de asegurados
        'Asegurado ' || seq as nombre_asegurado,
        -- Vendedores
        CASE (seq % 3)
            WHEN 0 THEN 'Carlos Pérez'
            WHEN 1 THEN 'Ana López'
            ELSE 'María Rodríguez'
        END as vendedor_nombre,
        -- Tipo de siniestro según ramo
        CASE (seq % 8)
            WHEN 0 THEN 'Colisión vehicular'
            WHEN 1 THEN 'Fallecimiento'
            WHEN 2 THEN 'Incendio estructural'
            WHEN 3 THEN 'Incumplimiento contractual'
            WHEN 4 THEN 'Daños a terceros'
            WHEN 5 THEN 'Hospitalización'
            WHEN 6 THEN 'Daños por agua'
            ELSE 'Pérdida de carga'
        END as tipo_sin,
        -- Descripción
        'Descripción del siniestro ' || seq || ' para pruebas de KPI' as desc_sin,
        -- Estados internos basados en distribución KPI
        CASE 
            -- 8% Desistimiento (seq 1-10)
            WHEN seq <= 10 THEN 'DESISTIMIENTO'
            -- 12% Objetados (seq 11-24)
            WHEN seq BETWEEN 11 AND 24 THEN 'OBJECIÓN'
            -- 19% Backlog (sin finalizar) - últimos 23
            WHEN seq > 97 THEN CASE (seq % 5)
                WHEN 0 THEN 'AVISO SINIESTRO'
                WHEN 1 THEN 'ESTUDIO TÉCNICO CORREDORES'
                WHEN 2 THEN 'RADICACIÓN COMPAÑÍA'
                WHEN 3 THEN 'AJUSTADOR'
                ELSE 'DOCUMENTOS ADICIONALES'
            END
            -- Resto: distribuidos en estados normales
            ELSE CASE (seq % 6)
                WHEN 0 THEN 'LIQUIDACIÓN'
                WHEN 1 THEN 'RATIFICACIÓN LIQUIDACIÓN'
                WHEN 2 THEN 'FIRMA INDEMNIZACIÓN'
                WHEN 3 THEN 'EN PROCESO PAGO INDEMNIZACIÓN'
                WHEN 4 THEN 'FINALIZADO'
                ELSE 'PAGADO'
            END
        END as estado_interno_val,
        -- Finalizado: solo si NO está en backlog (últimos 23) ni desistimiento
        CASE 
            WHEN seq <= 10 THEN TRUE  -- Desistimiento cuenta como finalizado
            WHEN seq > 97 THEN FALSE  -- Backlog
            ELSE TRUE  -- Resto finalizados
        END as finalizado_val,
        -- Fecha aviso: máximo 3 días después de ocurrencia
        DATE '2025-03-01' + ((seq - 1) % 365) * INTERVAL '1 day' + ((seq % 3) + 1) * INTERVAL '1 day' as fecha_aviso,
        -- Fecha notificación: 2-5 días después del aviso
        DATE '2025-03-01' + ((seq - 1) % 365) * INTERVAL '1 day' + ((seq % 3) + 3) * INTERVAL '1 day' as fecha_notif,
        -- Monto según ramo
        CASE (seq % 8)
            WHEN 0 THEN 15000000 + (seq * 100000)  -- Auto: 15M+
            WHEN 1 THEN 50000000 + (seq * 500000)  -- Vida: 50M+
            WHEN 2 THEN 80000000 + (seq * 1000000) -- Incendio: 80M+
            WHEN 3 THEN 30000000 + (seq * 300000)  -- Cumplimiento: 30M+
            WHEN 4 THEN 100000000 + (seq * 2000000) -- RCE: 100M+
            WHEN 5 THEN 2000000 + (seq * 50000)    -- Salud: 2M+
            WHEN 6 THEN 2500000 + (seq * 80000)    -- Hogar: 2.5M+
            ELSE 50000000 + (seq * 600000)         -- Transporte: 50M+
        END as monto
    FROM generate_series(1, 120) as seq
) subq;

-- ============================================================================
-- 11.3 GENERACIÓN DE ETAPAS (siniestro_etapas)
-- ============================================================================

INSERT INTO siniestro_etapas (
    claim_id,
    etapa_1_fecha,
    etapa_2_fecha,
    etapa_3_fecha,
    etapa_4_fecha,
    etapa_5_fecha,
    etapa_6_fecha,
    etapa_7_fecha,
    etapa_8_fecha,
    etapa_9_fecha,
    etapa_10_fecha,
    etapa_11_fecha,
    etapa_12_fecha,
    etapa_13_fecha,
    etapa_14_fecha,
    etapa_15_fecha,
    etapa_16_fecha,
    is_active,
    created_at
)
SELECT 
    c.id_softseguros as claim_id,
    -- Etapa 1: Aviso (fecha_ocurrencia + 1-3 días)
    (c.fecha_ocurrencia + ((seq % 3) + 1) * INTERVAL '1 day')::DATE as etapa_1_fecha,
    -- Etapa 2: Radicación (etapa_1 + 2-4 días hábiles)
    (c.fecha_ocurrencia + ((seq % 3) + 3) * INTERVAL '1 day')::DATE as etapa_2_fecha,
    -- Etapa 3: Ajustador (etapa_2 + 3-7 días)
    CASE 
        WHEN seq <= 10 THEN NULL  -- Desistimiento: no avanza
        ELSE (c.fecha_ocurrencia + ((seq % 5) + 7) * INTERVAL '1 day')::DATE
    END as etapa_3_fecha,
    -- Etapa 4: Documentos adicionales (etapa_3 + 2-5 días)
    CASE 
        WHEN seq <= 10 THEN NULL
        ELSE (c.fecha_ocurrencia + ((seq % 5) + 10) * INTERVAL '1 day')::DATE
    END as etapa_4_fecha,
    -- Etapa 5: Asistencia (etapa_4 + 1-3 días)
    CASE 
        WHEN seq <= 10 THEN NULL
        ELSE (c.fecha_ocurrencia + ((seq % 3) + 13) * INTERVAL '1 day')::DATE
    END as etapa_5_fecha,
    -- Etapa 6: Liquidación (etapa_5 + 2-5 días)
    CASE 
        WHEN seq <= 10 THEN NULL
        ELSE (c.fecha_ocurrencia + ((seq % 5) + 15) * INTERVAL '1 day')::DATE
    END as etapa_6_fecha,
    -- Etapa 7: Objeción (12% de casos: seq 11-24)
    CASE 
        WHEN seq <= 10 THEN NULL
        WHEN seq BETWEEN 11 AND 24 THEN (c.fecha_ocurrencia + ((seq % 4) + 18) * INTERVAL '1 day')::DATE
        ELSE NULL
    END as etapa_7_fecha,
    -- Etapa 8: Reconsideración Liquidación
    CASE 
        WHEN seq <= 24 THEN NULL
        WHEN seq % 20 = 0 THEN (c.fecha_ocurrencia + 25 * INTERVAL '1 day')::DATE
        ELSE NULL
    END as etapa_8_fecha,
    -- Etapa 9: Reconsideración Objeción
    CASE 
        WHEN seq <= 24 THEN NULL
        WHEN seq % 25 = 0 THEN (c.fecha_ocurrencia + 27 * INTERVAL '1 day')::DATE
        ELSE NULL
    END as etapa_9_fecha,
    -- Etapa 10: Desistimiento (8% de casos: seq 1-10)
    CASE 
        WHEN seq <= 10 THEN (c.fecha_ocurrencia + ((seq % 5) + 15) * INTERVAL '1 day')::DATE
        ELSE NULL
    END as etapa_10_fecha,
    -- Etapa 11: Ratificación Liquidación
    CASE 
        WHEN seq <= 10 THEN NULL
        WHEN seq BETWEEN 11 AND 24 THEN NULL  -- Objetados no llegan aquí
        ELSE (c.fecha_ocurrencia + 20 * INTERVAL '1 day')::DATE
    END as etapa_11_fecha,
    -- Etapa 12: Ratificación Objeción
    CASE 
        WHEN seq <= 10 THEN NULL
        WHEN seq BETWEEN 11 AND 24 THEN (c.fecha_ocurrencia + 22 * INTERVAL '1 day')::DATE
        ELSE NULL
    END as etapa_12_fecha,
    -- Etapa 13: Prescripción (rara, ~2%)
    CASE 
        WHEN seq % 50 = 0 THEN (c.fecha_ocurrencia + INTERVAL '1 year')::DATE
        ELSE NULL
    END as etapa_13_fecha,
    -- Etapa 14: Proceso Jurídico (~5%)
    CASE 
        WHEN seq % 20 = 0 THEN (c.fecha_ocurrencia + 35 * INTERVAL '1 day')::DATE
        ELSE NULL
    END as etapa_14_fecha,
    -- Etapa 15: Finalizado
    CASE 
        WHEN seq <= 10 THEN (c.fecha_ocurrencia + 18 * INTERVAL '1 day')::DATE  -- Desistimiento
        WHEN seq BETWEEN 11 AND 24 THEN NULL  -- Objetados no finalizan
        WHEN seq > 97 THEN NULL  -- Backlog
        ELSE (c.fecha_ocurrencia + 25 * INTERVAL '1 day')::DATE
    END as etapa_15_fecha,
    -- Etapa 16: Pagado (solo casos normal/completados)
    CASE 
        WHEN seq <= 10 THEN NULL  -- Desistimiento no tiene pago
        WHEN seq BETWEEN 11 AND 24 THEN NULL  -- Objetados no tienen pago
        WHEN seq > 97 THEN NULL  -- Backlog
        -- 85% lead time normal (15-25 días), 15% alerta (>30 días)
        WHEN seq % 15 = 0 THEN (c.fecha_ocurrencia + 35 * INTERVAL '1 day')::DATE  -- Alerta SLA
        ELSE (c.fecha_ocurrencia + ((seq % 10) + 18) * INTERVAL '1 day')::DATE  -- Normal
    END as etapa_16_fecha,
    TRUE as is_active,
    NOW() as created_at
FROM (
    SELECT 
        c.id_softseguros,
        ROW_NUMBER() OVER (ORDER BY c.created_at) as seq,
        c.fecha_ocurrencia
    FROM claims c
    WHERE c.id_softseguros LIKE 'TEST-%'
) c
ON CONFLICT (claim_id) DO UPDATE SET
    etapa_1_fecha = EXCLUDED.etapa_1_fecha,
    etapa_2_fecha = EXCLUDED.etapa_2_fecha,
    etapa_3_fecha = EXCLUDED.etapa_3_fecha,
    etapa_4_fecha = EXCLUDED.etapa_4_fecha,
    etapa_5_fecha = EXCLUDED.etapa_5_fecha,
    etapa_6_fecha = EXCLUDED.etapa_6_fecha,
    etapa_7_fecha = EXCLUDED.etapa_7_fecha,
    etapa_8_fecha = EXCLUDED.etapa_8_fecha,
    etapa_9_fecha = EXCLUDED.etapa_9_fecha,
    etapa_10_fecha = EXCLUDED.etapa_10_fecha,
    etapa_11_fecha = EXCLUDED.etapa_11_fecha,
    etapa_12_fecha = EXCLUDED.etapa_12_fecha,
    etapa_13_fecha = EXCLUDED.etapa_13_fecha,
    etapa_14_fecha = EXCLUDED.etapa_14_fecha,
    etapa_15_fecha = EXCLUDED.etapa_15_fecha,
    etapa_16_fecha = EXCLUDED.etapa_16_fecha,
    updated_at = NOW();

-- ============================================================================
-- 11.4 GENERACIÓN DE AMPAROS
-- 1-3 amparos por claim, suma = monto_reclamo
-- ============================================================================

INSERT INTO amparos (claim_id, numero_siniestro, nombre_reclamante, amparo, valor)
SELECT 
    c.id_softseguros as claim_id,
    c.numero_siniestro,
    c.asegurado as nombre_reclamante,
    amp.amparo_nombre as amparo,
    amp.valor as valor
FROM claims c
CROSS JOIN LATERAL (
    -- Generar 1-3 amparos por claim
    SELECT 
        CASE (seq % 12)
            WHEN 0 THEN 'Daños materiales'
            WHEN 1 THEN 'Responsabilidad civil'
            WHEN 2 THEN 'Gastos médicos'
            WHEN 3 THEN 'Muerte accidental'
            WHEN 4 THEN 'Incapacidad total'
            WHEN 5 THEN 'Pérdida total'
            WHEN 6 THEN 'Daños a terceros'
            WHEN 7 THEN 'Robo'
            WHEN 8 THEN 'Asistencia jurídica'
            WHEN 9 THEN 'Gastos de transporte'
            WHEN 10 THEN 'Hospedaje'
            ELSE 'Otros conceptos'
        END as amparo_nombre,
        CASE seq
            WHEN 1 THEN ROUND(c.monto_reclamo * 0.6)::NUMERIC
            WHEN 2 THEN ROUND(c.monto_reclamo * 0.3)::NUMERIC
            WHEN 3 THEN ROUND(c.monto_reclamo * 0.1)::NUMERIC
        END as valor
    FROM generate_series(1, (LENGTH(c.id_softseguros) % 3) + 1) as seq
) amp
WHERE c.id_softseguros LIKE 'TEST-%'
ON CONFLICT DO NOTHING;

-- Ajustar valores para que sumen exactamente al monto_reclamo
WITH amparos_totals AS (
    SELECT 
        claim_id,
        SUM(valor) as total_amparos,
        (SELECT monto_reclamo FROM claims c WHERE c.id_softseguros = a.claim_id) as monto_claim
    FROM amparos a
    WHERE claim_id LIKE 'TEST-%'
    GROUP BY claim_id
),
ajustes AS (
    SELECT 
        claim_id,
        monto_claim - total_amparos as diferencia
    FROM amparos_totals
    WHERE total_amparos != monto_claim
)
UPDATE amparos a
SET valor = valor + aj.diferencia
FROM ajustes aj
WHERE a.claim_id = aj.claim_id
    AND a.id = (SELECT id FROM amparos WHERE claim_id = aj.claim_id ORDER BY created_at DESC LIMIT 1);

-- ============================================================================
-- 11.5 GENERACIÓN DE STATE_HISTORY
-- Historial de cambios de estado con duraciones
-- ============================================================================

INSERT INTO state_history (claim_id, state, start_date, end_date, days_duration, author)
SELECT 
    c.id_softseguros as claim_id,
    estado.state_name as state,
    estado.fecha_inicio as start_date,
    estado.fecha_fin as end_date,
    EXTRACT(DAY FROM (estado.fecha_fin - estado.fecha_inicio))::INTEGER as days_duration,
    c.tecnico_asignado as author
FROM claims c
CROSS JOIN LATERAL (
    VALUES 
        ('AVISO SINIESTRO', c.fecha_ocurrencia::TIMESTAMP, (c.fecha_ocurrencia + INTERVAL '2 days')::TIMESTAMP),
        ('ESTUDIO TÉCNICO CORREDORES', (c.fecha_ocurrencia + INTERVAL '2 days')::TIMESTAMP, (c.fecha_ocurrencia + INTERVAL '5 days')::TIMESTAMP),
        ('RADICACIÓN COMPAÑÍA', (c.fecha_ocurrencia + INTERVAL '5 days')::TIMESTAMP, (c.fecha_ocurrencia + INTERVAL '8 days')::TIMESTAMP),
        ('AJUSTADOR', (c.fecha_ocurrencia + INTERVAL '8 days')::TIMESTAMP, (c.fecha_ocurrencia + INTERVAL '12 days')::TIMESTAMP),
        ('LIQUIDACIÓN', (c.fecha_ocurrencia + INTERVAL '12 days')::TIMESTAMP, (c.fecha_ocurrencia + INTERVAL '16 days')::TIMESTAMP),
        ('PAGADO', (c.fecha_ocurrencia + INTERVAL '16 days')::TIMESTAMP, (c.fecha_ocurrencia + INTERVAL '20 days')::TIMESTAMP)
) AS estado(state_name, fecha_inicio, fecha_fin)
WHERE c.id_softseguros LIKE 'TEST-%'
    AND c.finalizado = TRUE
    AND c.estado_interno NOT IN ('DESISTIMIENTO', 'OBJECIÓN');

-- ============================================================================
-- 11.6 GENERACIÓN DE TIMELINE
-- Eventos de seguimiento
-- ============================================================================

INSERT INTO timeline (claim_id, date, author, text, is_system)
SELECT 
    c.id_softseguros as claim_id,
    evento.fecha as date,
    COALESCE(c.tecnico_asignado, 'Sistema') as author,
    evento.descripcion as text,
    evento.es_sistema as is_system
FROM claims c
CROSS JOIN LATERAL (
    VALUES 
        (c.fecha_ocurrencia::TIMESTAMP, 'Siniestro registrado en el sistema', TRUE),
        ((c.fecha_ocurrencia + INTERVAL '1 day')::TIMESTAMP, 'Documentación inicial recibida', FALSE),
        ((c.fecha_ocurrencia + INTERVAL '5 days')::TIMESTAMP, 'Asignación a ajustador', FALSE),
        ((c.fecha_ocurrencia + INTERVAL '10 days')::TIMESTAMP, 'Inspección realizada', FALSE),
        ((c.fecha_ocurrencia + INTERVAL '15 days')::TIMESTAMP, 'Liquidación en proceso', FALSE)
) AS evento(fecha, descripcion, es_sistema)
WHERE c.id_softseguros LIKE 'TEST-%';

-- ============================================================================
-- 11.7 QUERIES DE VALIDACIÓN DE KPIs
-- ============================================================================

-- Query 1: Verificar Lead Time (debe ser ~25 días)
SELECT 
    'LEAD TIME PROMEDIO' as metrica,
    AVG(
        CASE 
            WHEN se.etapa_1_fecha IS NOT NULL AND se.etapa_16_fecha IS NOT NULL
            THEN (se.etapa_16_fecha - se.etapa_1_fecha)
            ELSE NULL
        END
    )::NUMERIC(10,2) as dias_promedio,
    COUNT(*) FILTER (WHERE se.etapa_16_fecha IS NOT NULL) as total_pagados
FROM siniestro_etapas se
JOIN claims c ON se.claim_id = c.id_softseguros
WHERE c.id_softseguros LIKE 'TEST-%';

-- Query 2: Verificar casos con Lead Time >30 días (debe ser ~15%)
SELECT 
    'ALERTAS SLA (>30 días)' as metrica,
    COUNT(*) as casos_alerta,
    ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM siniestro_etapas se2 
        JOIN claims c2 ON se2.claim_id = c2.id_softseguros 
        WHERE c2.id_softseguros LIKE 'TEST-%' AND se2.etapa_16_fecha IS NOT NULL), 0), 2) as porcentaje
FROM siniestro_etapas se
JOIN claims c ON se.claim_id = c.id_softseguros
WHERE c.id_softseguros LIKE 'TEST-%'
    AND se.etapa_1_fecha IS NOT NULL 
    AND se.etapa_16_fecha IS NOT NULL
    AND (se.etapa_16_fecha - se.etapa_1_fecha) > 30;

-- Query 3: Verificar Tasa de Desistimiento (debe ser 8%)
SELECT 
    'TASA DESISTIMIENTO' as metrica,
    COUNT(*) as total_desistimientos,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM claims WHERE id_softseguros LIKE 'TEST-%'), 2) as porcentaje
FROM claims c
WHERE c.id_softseguros LIKE 'TEST-%'
    AND c.estado_interno = 'DESISTIMIENTO';

-- Query 4: Verificar Tasa de Objetados (debe ser 12%)
SELECT 
    'TASA OBJETADOS' as metrica,
    COUNT(*) as total_objetados,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM claims WHERE id_softseguros LIKE 'TEST-%'), 2) as porcentaje
FROM siniestro_etapas se
JOIN claims c ON se.claim_id = c.id_softseguros
WHERE c.id_softseguros LIKE 'TEST-%'
    AND se.etapa_7_fecha IS NOT NULL;

-- Query 5: Verificar Backlog (debe ser 19%)
SELECT 
    'BACKLOG ACTIVO' as metrica,
    COUNT(*) as casos_activos,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM claims WHERE id_softseguros LIKE 'TEST-%'), 2) as porcentaje
FROM siniestro_etapas se
JOIN claims c ON se.claim_id = c.id_softseguros
WHERE c.id_softseguros LIKE 'TEST-%'
    AND se.etapa_15_fecha IS NULL 
    AND se.etapa_16_fecha IS NULL;

-- Query 6: Resumen general
SELECT 
    'RESUMEN DATOS DE PRUEBA' as reporte,
    (SELECT COUNT(*) FROM claims WHERE id_softseguros LIKE 'TEST-%') as total_claims,
    (SELECT COUNT(*) FROM siniestro_etapas WHERE claim_id LIKE 'TEST-%') as total_etapas,
    (SELECT COUNT(*) FROM amparos WHERE claim_id LIKE 'TEST-%') as total_amparos,
    (SELECT COUNT(*) FROM state_history WHERE claim_id LIKE 'TEST-%') as total_historial,
    (SELECT COUNT(*) FROM timeline WHERE claim_id LIKE 'TEST-%') as total_timeline;

-- ============================================================================
-- FIN DEL SCRIPT DE GENERACIÓN DE DATOS DE PRUEBA
-- ============================================================================
