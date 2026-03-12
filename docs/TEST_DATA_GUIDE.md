# Guía de Uso - Generación de Datos de Prueba para KPIs

## Descripción

Este script genera **120 siniestros de prueba** con datos realistas distribuidos en un período de 1 año (Marzo 2025 - Marzo 2026), diseñados específicamente para validar los KPIs del Dashboard de SGS.

## 📊 Distribución de KPIs

| KPI               | Objetivo         | Implementación                   |
| ----------------- | ---------------- | -------------------------------- |
| **Lead Time**     | ~25 días hábiles | 85% de casos entre 15-30 días    |
| **Alertas SLA**   | 15%              | 18 casos con >30 días hábiles    |
| **Desistimiento** | 8%               | 10 casos con Etapa 10            |
| **Objetados**     | 12%              | 14 casos con Etapa 7             |
| **Backlog**       | 19%              | 23 casos sin Etapa 15/16         |
| **Retención**     | 85%              | Simulado en clientes finalizados |

## 📁 Archivos Generados

1. **`scripts/generate_test_data_kpi.sql`** - Script principal de generación
2. **`scripts/validate_test_data_kpi.sql`** - Script de validación de KPIs

## 🚀 Instrucciones de Uso

### 1. Preparación

Asegúrate de tener:

- Conexión a la base de datos Supabase
- Las tablas `claims`, `siniestro_etapas`, `amparos`, `state_history`, `timeline` creadas
- Usuarios técnicos existentes en tabla `users`

### 2. Ejecutar Generación de Datos

```bash
# Usando psql
psql -h your-host -U your-user -d your-database -f scripts/generate_test_data_kpi.sql

# O desde la consola SQL de Supabase
\i scripts/generate_test_data_kpi.sql
```

**Nota:** Los datos se identifican con prefijo `TEST-` para facilitar su eliminación posterior.

### 3. Validar KPIs Generados

```bash
psql -h your-host -U your-user -d your-database -f scripts/validate_test_data_kpi.sql
```

Este script mostrará:

- Lead Time promedio (días hábiles)
- Porcentaje de alertas SLA
- Tasa de desistimiento
- Tasa de objetados
- Backlog activo
- Verificación de integridad de datos

## 🗃️ Estructura de Datos Generados

### Tablas Afectadas

```
claims (120 registros)
├── id_softseguros: TEST-0001 a TEST-0120
├── Período: Marzo 2025 - Marzo 2026
├── 5 aseguradoras colombianas
├── 8 ramos de seguro
└── 4 técnicos asignados

siniestro_etapas (120 registros)
├── 16 etapas con fechas lógicas
├── Progresión secuencial válida
└── Distribución KPI implementada

amparos (~200 registros)
├── 1-3 amparos por siniestro
└── Suma de valores = monto_reclamo

state_history (~400 registros)
└── Historial de cambios de estado

timeline (~500 registros)
└── Eventos de seguimiento

ramos (8 registros)
└── Tabla maestra de ramos normalizada
```

## 🎯 Casos Específicos por Tipo

### Desistimientos (8% - 10 casos)

- IDs: TEST-0001 a TEST-0010
- Estado: `DESISTIMIENTO`
- Etapa 10 con fecha
- Sin Etapa 16 (Pagado)

### Objetados (12% - 14 casos)

- IDs: TEST-0011 a TEST-0024
- Etapa 7 con fecha
- Estado: `OBJECIÓN`

### Backlog (19% - 23 casos)

- IDs: TEST-0098 a TEST-0120
- Sin Etapa 15 (Finalizado)
- Sin Etapa 16 (Pagado)
- Estados: Aviso, Estudio, Radicación, Ajustador

### Lead Time Alerta (15% - 18 casos)

- IDs múltiplos de 15: TEST-0015, TEST-0030, etc.
- Etapa 1 a 16: >30 días hábiles

## 🔍 Queries de Validación Manual

### Verificar Lead Time

```sql
SELECT AVG(se.etapa_16_fecha - se.etapa_1_fecha) as dias_promedio
FROM siniestro_etapas se
JOIN claims c ON se.claim_id = c.id_softseguros
WHERE c.id_softseguros LIKE 'TEST-%'
  AND se.etapa_16_fecha IS NOT NULL;
```

### Verificar Distribución por Ramo

```sql
SELECT ramo, COUNT(*) as cantidad,
       ROUND(COUNT(*) * 100.0 / 120, 2) as porcentaje
FROM claims
WHERE id_softseguros LIKE 'TEST-%'
GROUP BY ramo;
```

### Verificar Integridad Amparos

```sql
SELECT
    c.id_softseguros,
    c.monto_reclamo,
    SUM(a.valor) as suma_amparos,
    CASE WHEN SUM(a.valor) = c.monto_reclamo THEN 'OK' ELSE 'ERROR' END as estado
FROM claims c
LEFT JOIN amparos a ON c.id_softseguros = a.claim_id
WHERE c.id_softseguros LIKE 'TEST-%'
GROUP BY c.id_softseguros, c.monto_reclamo
HAVING SUM(a.valor) != c.monto_reclamo;
```

## 🧹 Limpieza de Datos de Prueba

Si necesitas eliminar los datos de prueba:

```sql
-- Eliminar en orden por dependencias
DELETE FROM amparos WHERE claim_id LIKE 'TEST-%';
DELETE FROM state_history WHERE claim_id LIKE 'TEST-%';
DELETE FROM timeline WHERE claim_id LIKE 'TEST-%';
DELETE FROM siniestro_etapas WHERE claim_id LIKE 'TEST-%';
DELETE FROM claims WHERE id_softseguros LIKE 'TEST-%';
-- Opcional: eliminar tabla de ramos
-- DROP TABLE IF EXISTS ramos;
```

## ⚠️ Notas Importantes

1. **IDs únicos**: Los siniestros usan prefijo `TEST-` para evitar colisiones con datos reales
2. **Fechas**: Todas las fechas son coherentes (etapa N siempre > etapa N-1)
3. **Integridad**: La suma de amparos coincide exactamente con monto_reclamo
4. **SLA**: Se calculan días hábiles excluyendo fines de semana
5. **Prescripción**: Campos calculados automáticamente (2 y 5 años)

## 📈 Métricas Esperadas Post-Ejecución

Después de ejecutar el script de validación, deberías ver:

```
LEAD TIME PROMEDIO: ~25 días hábiles ✓
ALERTAS SLA: 15% de casos ✓
TASA DESISTIMIENTO: 8% ✓
TASA OBJETADOS: 12% ✓
BACKLOG: 19% ✓
INTEGRIDAD: 0 anomalías ✓
```

## 🆘 Solución de Problemas

### Error: "tecnico_id no encontrado"

**Causa**: Los usuarios técnicos no existen en la tabla `users`  
**Solución**: Ejecutar primero el script de creación de usuarios

### Error: "violación de constraint unique"

**Causa**: Datos de prueba ya existen  
**Solución**: Ejecutar el script de limpieza primero

### KPIs no cumplen objetivos

**Causa**: Distribución aleatoria puede variar ligeramente  
**Solución**: Es normal variación de ±2%, ejecutar nuevamente si es necesario

## 📞 Soporte

Para dudas o problemas con la generación de datos:

1. Revisar logs de ejecución
2. Ejecutar `validate_test_data_kpi.sql` para diagnóstico
3. Verificar integridad de datos con queries manuales

---

**Versión**: 1.0  
**Fecha**: Marzo 2026  
**Autor**: SGS Development Team
