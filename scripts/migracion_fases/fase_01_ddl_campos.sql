-- ============================================================================
-- FASE 1: DDL - CREAR CAMPOS E ÍNDICES
-- ============================================================================
-- Ejecutar primero: Esta fase crea la estructura base
-- Tiempo estimado: < 1 minuto
-- Rollback: ALTER TABLE claims DROP COLUMN fecha_ultimo_seguimiento, 
--                               DROP COLUMN fecha_proximo_seguimiento;
-- ============================================================================

-- 1.1 Agregar campos nuevos a tabla claims
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS fecha_ultimo_seguimiento DATE,
ADD COLUMN IF NOT EXISTS fecha_proximo_seguimiento DATE;

-- 1.2 Agregar comentarios para documentación
COMMENT ON COLUMN claims.fecha_ultimo_seguimiento IS 
    'Última fecha extraída del campo ultimo_seguimiento_raw. Actualizado automáticamente por trigger.';
    
COMMENT ON COLUMN claims.fecha_proximo_seguimiento IS 
    'Fecha calculada del próximo seguimiento según etapa (solo etapas 1, 2, 13). Calculada automáticamente.';

-- 1.3 Crear índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_claims_fecha_proximo_vencidos 
ON claims(fecha_proximo_seguimiento) 
WHERE fecha_proximo_seguimiento < CURRENT_DATE;

CREATE INDEX IF NOT EXISTS idx_claims_fecha_proximo_proximos 
ON claims(fecha_proximo_seguimiento) 
WHERE fecha_proximo_seguimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days';

CREATE INDEX IF NOT EXISTS idx_claims_fecha_ultimo_desc 
ON claims(fecha_ultimo_seguimiento DESC NULLS LAST);

-- 1.4 Verificación: ¿Se crearon los campos e índices?
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'claims' 
  AND column_name IN ('fecha_ultimo_seguimiento', 'fecha_proximo_seguimiento')
ORDER BY ordinal_position;

-- 1.5 Verificación: Contar cuántos registros tienen el campo ultimo_seguimiento_raw
SELECT 
    COUNT(*) as total_registros,
    COUNT(ultimo_seguimiento_raw) as con_texto_seguimiento,
    COUNT(*) - COUNT(ultimo_seguimiento_raw) as sin_texto
FROM claims;

-- ============================================================================
-- NOTAS POST-EJECUCIÓN:
-- 
-- ✅ Si la consulta 1.4 retorna 2 filas, los campos se crearon correctamente
-- ✅ Si la consulta 1.5 muestra registros con texto, hay datos para migrar
-- 
-- ⚠️  Si hay errores, verificar:
--     - Permisos de ALTER TABLE
--     - Que no existan campos con esos nombres
--     - Espacio en disco suficiente para índices
--
-- 📝 Próximo paso: Ejecutar fase_02_funciones.sql
-- ============================================================================
