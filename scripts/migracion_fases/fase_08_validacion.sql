-- ============================================================================
-- FASE 8: VALIDACIÓN FINAL Y REPORTE COMPLETO
-- ============================================================================
-- Ejecutar después de todas las fases anteriores
-- Valida que todo esté funcionando correctamente
-- Tiempo estimado: 2-5 minutos
-- ============================================================================

-- ============================================================================
-- 8.1 VALIDACIÓN: Estructura de la tabla claims
-- ============================================================================

SELECT 
    'ESTRUCTURA CLAIMS' as seccion,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'claims' 
  AND column_name IN (
    'id_softseguros',
    'estado_softseguros', 
    'ultimo_seguimiento_raw',
    'fecha_aviso',
    'fecha_notificacion_aseguradora',
    'prescripcion_ordinaria',
    'prescripcion_extraordinaria',
    'fecha_ultimo_seguimiento',
    'fecha_proximo_seguimiento'
  )
ORDER BY ordinal_position;

-- ============================================================================
-- 8.2 VALIDACIÓN: Funciones creadas
-- ============================================================================

SELECT 
    'FUNCIONES CREADAS' as seccion,
    routine_name as nombre_funcion,
    routine_type as tipo,
    data_type as retorno
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name IN (
    'extraer_fecha_ultimo_seguimiento',
    'extraer_fecha_etapa',
    'calcular_fecha_proximo_seguimiento',
    'trg_actualizar_seguimiento'
  )
ORDER BY routine_name;

-- ============================================================================
-- 8.3 VALIDACIÓN: Triggers activos
-- ============================================================================

SELECT 
    'TRIGGERS ACTIVOS' as seccion,
    trigger_name,
    event_manipulation as evento,
    action_timing as timing
FROM information_schema.triggers 
WHERE event_object_table = 'claims'
  AND trigger_name LIKE 'trg_claims_seguimiento%'
ORDER BY trigger_name;

-- ============================================================================
-- 8.4 VALIDACIÓN: Índices creados
-- ============================================================================

SELECT 
    'ÍNDICES CREADOS' as seccion,
    indexname as nombre_indice,
    indexdef as definicion
FROM pg_indexes 
WHERE tablename = 'claims'
  AND indexname LIKE 'idx_claims_fecha%'
ORDER BY indexname;

-- ============================================================================
-- 8.5 VALIDACIÓN: Vistas disponibles
-- ============================================================================

SELECT 
    'VISTAS DISPONIBLES' as seccion,
    table_name as vista
FROM information_schema.views 
WHERE table_schema = 'public'
  AND table_name LIKE 'vw_%'
ORDER BY table_name;

-- ============================================================================
-- 8.6 REPORTE EJECUTIVO: Estadísticas de datos
-- ============================================================================

SELECT 
    '═══════════════════════════════════════════════════════' as "REPORTE FINAL DE MIGRACIÓN";

SELECT 
    '📊 ESTADÍSTICAS GENERALES' as seccion,
    (SELECT COUNT(*) FROM claims) as total_siniestros,
    (SELECT COUNT(*) FROM siniestro_etapas) as registros_etapas,
    (SELECT COUNT(*) FROM claims WHERE fecha_ultimo_seguimiento IS NOT NULL) as con_fecha_ultimo,
    (SELECT COUNT(*) FROM claims WHERE fecha_proximo_seguimiento IS NOT NULL) as con_fecha_proximo;

-- ============================================================================
-- 8.7 REPORTE: Distribución por etapa calculable
-- ============================================================================

SELECT 
    '📈 ETAPAS CALCULABLES' as seccion,
    estado_softseguros,
    COUNT(*) as total,
    COUNT(fecha_proximo_seguimiento) as con_fecha_calculada,
    ROUND(AVG(fecha_proximo_seguimiento - fecha_ultimo_seguimiento)::numeric, 1) as promedio_dias,
    MIN(fecha_proximo_seguimiento - fecha_ultimo_seguimiento) as min_dias,
    MAX(fecha_proximo_seguimiento - fecha_ultimo_seguimiento) as max_dias
FROM claims
WHERE UPPER(estado_softseguros) IN (
    'AVISO SINIESTRO', '1 AVISO SINIESTRO', 'AVISO',
    'RADICACIÓN COMPAÑÍA', 'RADICACION COMPAÑIA', 'RADICACIÓN', 'RADICACION',
    'PRESCRIPCIÓN', 'PRESCRIPCION'
)
GROUP BY estado_softseguros
ORDER BY estado_softseguros;

-- ============================================================================
-- 8.8 REPORTE: Alertas actuales
-- ============================================================================

SELECT 
    '🚨 ALERTAS DE SEGUIMIENTO' as seccion,
    estado_alerta,
    COUNT(*) as cantidad,
    ROUND(AVG(dias_desde_ultimo)::numeric, 1) as promedio_dias_sin_seguir
FROM vw_seguimientos_alertas
GROUP BY estado_alerta
ORDER BY 
    CASE estado_alerta
        WHEN 'VENCIDO' THEN 1
        WHEN 'PROXIMO_3_DIAS' THEN 2
        WHEN 'PROXIMO_7_DIAS' THEN 3
        ELSE 4
    END;

-- ============================================================================
-- 8.9 REPORTE: Extracción de etapas históricas
-- ============================================================================

SELECT 
    '📋 ETAPAS EXTRAÍDAS (siniestro_etapas)' as seccion,
    'Etapa 1 (Aviso)' as etapa,
    COUNT(*) FILTER (WHERE etapa_1_fecha IS NOT NULL) as cantidad
FROM siniestro_etapas
UNION ALL
SELECT 
    '📋 ETAPAS EXTRAÍDAS (siniestro_etapas)',
    'Etapa 2 (Radicación)',
    COUNT(*) FILTER (WHERE etapa_2_fecha IS NOT NULL)
FROM siniestro_etapas
UNION ALL
SELECT 
    '📋 ETAPAS EXTRAÍDAS (siniestro_etapas)',
    'Etapa 7 (Objeción)',
    COUNT(*) FILTER (WHERE etapa_7_fecha IS NOT NULL)
FROM siniestro_etapas
UNION ALL
SELECT 
    '📋 ETAPAS EXTRAÍDAS (siniestro_etapas)',
    'Etapa 10 (Desistimiento)',
    COUNT(*) FILTER (WHERE etapa_10_fecha IS NOT NULL)
FROM siniestro_etapas
UNION ALL
SELECT 
    '📋 ETAPAS EXTRAÍDAS (siniestro_etapas)',
    'Etapa 16 (Pagado)',
    COUNT(*) FILTER (WHERE etapa_16_fecha IS NOT NULL)
FROM siniestro_etapas;

-- ============================================================================
-- 8.10 MUESTRA DE DATOS: Verificar extracción correcta
-- ============================================================================

SELECT 
    '═══════════════════════════════════════════════════════' as "MUESTRA DE VALIDACIÓN";

-- Mostrar 5 registros con sus fechas extraídas
SELECT 
    'MUESTRA: Claims con fechas' as tipo,
    id_softseguros,
    numero_siniestro,
    LEFT(estado_softseguros, 20) as estado,
    fecha_ultimo_seguimiento,
    fecha_proximo_seguimiento,
    fecha_proximo_seguimiento - fecha_ultimo_seguimiento as dias_calculados
FROM claims
WHERE fecha_ultimo_seguimiento IS NOT NULL
  AND fecha_proximo_seguimiento IS NOT NULL
LIMIT 5;

-- ============================================================================
-- 8.11 CHECKLIST DE VALIDACIÓN
-- ============================================================================

DO $$
DECLARE
    v_campos_ok BOOLEAN;
    v_funciones_ok BOOLEAN;
    v_triggers_ok BOOLEAN;
    v_indices_ok BOOLEAN;
    v_vistas_ok BOOLEAN;
    v_datos_ok BOOLEAN;
BEGIN
    -- Verificar campos
    SELECT COUNT(*) = 2 INTO v_campos_ok
    FROM information_schema.columns 
    WHERE table_name = 'claims' 
      AND column_name IN ('fecha_ultimo_seguimiento', 'fecha_proximo_seguimiento');
    
    -- Verificar funciones
    SELECT COUNT(*) = 4 INTO v_funciones_ok
    FROM information_schema.routines 
    WHERE routine_schema = 'public'
      AND routine_name IN (
        'extraer_fecha_ultimo_seguimiento',
        'extraer_fecha_etapa',
        'calcular_fecha_proximo_seguimiento',
        'trg_actualizar_seguimiento'
      );
    
    -- Verificar triggers
    SELECT COUNT(*) = 2 INTO v_triggers_ok
    FROM information_schema.triggers 
    WHERE event_object_table = 'claims'
      AND trigger_name LIKE 'trg_claims_seguimiento%';
    
    -- Verificar índices
    SELECT COUNT(*) >= 2 INTO v_indices_ok
    FROM pg_indexes 
    WHERE tablename = 'claims'
      AND indexname LIKE 'idx_claims_fecha%';
    
    -- Verificar vistas
    SELECT COUNT(*) >= 3 INTO v_vistas_ok
    FROM information_schema.views 
    WHERE table_schema = 'public'
      AND table_name LIKE 'vw_%';
    
    -- Verificar datos
    SELECT COUNT(*) > 0 INTO v_datos_ok
    FROM claims 
    WHERE fecha_ultimo_seguimiento IS NOT NULL;
    
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '           CHECKLIST DE VALIDACIÓN FINAL              ';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '✅ Campos creados: %', CASE WHEN v_campos_ok THEN 'SÍ' ELSE 'NO' END;
    RAISE NOTICE '✅ Funciones creadas: %', CASE WHEN v_funciones_ok THEN 'SÍ' ELSE 'NO' END;
    RAISE NOTICE '✅ Triggers activos: %', CASE WHEN v_triggers_ok THEN 'SÍ' ELSE 'NO' END;
    RAISE NOTICE '✅ Índices creados: %', CASE WHEN v_indices_ok THEN 'SÍ' ELSE 'NO' END;
    RAISE NOTICE '✅ Vistas disponibles: %', CASE WHEN v_vistas_ok THEN 'SÍ' ELSE 'NO' END;
    RAISE NOTICE '✅ Datos migrados: %', CASE WHEN v_datos_ok THEN 'SÍ' ELSE 'NO' END;
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    
    IF v_campos_ok AND v_funciones_ok AND v_triggers_ok AND v_indices_ok AND v_vistas_ok AND v_datos_ok THEN
        RAISE NOTICE '    🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE 🎉';
        RAISE NOTICE '═══════════════════════════════════════════════════════';
    ELSE
        RAISE NOTICE '    ⚠️  REVISAR ELEMENTOS MARCADOS COMO "NO"';
        RAISE NOTICE '═══════════════════════════════════════════════════════';
    END IF;
END $$;

-- ============================================================================
-- 8.12 PRÓXIMOS PASOS RECOMENDADOS
-- ============================================================================

SELECT 
    '═══════════════════════════════════════════════════════' as "PRÓXIMOS PASOS";

SELECT 
    '1' as paso,
    'Monitoreo diario' as accion,
    'SELECT * FROM vw_seguimientos_alertas WHERE estado_alerta = ''VENCIDO'';' as query_ejemplo;

SELECT 
    '2' as paso,
    'Reporte ejecutivo' as accion,
    'SELECT * FROM vw_resumen_migracion;' as query_ejemplo;

SELECT 
    '3' as paso,
    'KPI de etapas' as accion,
    'SELECT * FROM vw_kpi_etapas WHERE lead_time_total_dias IS NOT NULL LIMIT 10;' as query_ejemplo;

SELECT 
    '4' as paso,
    'Lista de trabajo' as accion,
    'SELECT * FROM vw_sin_seguimiento_reciente WHERE nivel_riesgo = ''CRITICO'';' as query_ejemplo;

-- ============================================================================
-- FIN DEL SCRIPT DE VALIDACIÓN
-- ============================================================================

SELECT 
    '═══════════════════════════════════════════════════════' as "✅ VALIDACIÓN COMPLETADA";

SELECT 
    '📝 Documentación:' as nota,
    '• Fase 1: Campos e índices creados' as item_1,
    '• Fase 2-4: Funciones SQL creadas y probadas' as item_2,
    '• Fase 5: Datos históricos migrados' as item_3,
    '• Fase 6: Triggers activados para actualización automática' as item_4,
    '• Fase 7: Vistas de monitoreo disponibles' as item_5,
    '• Fase 8: Validación completada' as item_6;

-- ============================================================================
-- NOTAS FINALES
-- ============================================================================

/*
✅ MIGRACIÓN COMPLETADA

El sistema de seguimiento de fechas está ahora completamente operativo:

1. EXTRACCIÓN AUTOMÁTICA
   - Cada vez que se actualiza ultimo_seguimiento_raw, se extrae la fecha
   - Las etapas 3-16 se extraen por keywords y se guardan en siniestro_etapas

2. CÁLCULO DE PRÓXIMOS SEGUIMIENTOS
   - Etapa 1 (Aviso): +3 días
   - Etapa 2 (Radicación): +1 mes  
   - Etapa 13 (Prescripción): Usa fecha de prescripción calculada

3. ALERTAS Y MONITOREO
   - vw_seguimientos_alertas: Vencidos y próximos a vencer
   - vw_sin_seguimiento_reciente: Siniestros sin seguimiento
   - vw_kpi_etapas: Métricas de duración por etapa

4. MANTENIMIENTO
   - Los triggers mantienen los datos actualizados automáticamente
   - Para actualizaciones masivas, usar fase_05b_migracion_batch.sql

🚀 EL SISTEMA ESTÁ LISTO PARA PRODUCCIÓN
*/
