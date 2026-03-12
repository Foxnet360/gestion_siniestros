# 🚀 Guía de Ejecución por Fases - Migración de Fechas de Seguimiento

## 📋 Resumen

Esta migración implementa el seguimiento automático de fechas para la gestión de siniestros, extrayendo información del campo `ultimo_seguimiento_raw` y calculando fechas de próximo seguimiento según la etapa actual.

## 📁 Estructura de Archivos

```
scripts/
├── migracion_fechas_seguimiento_v2.sql    # Script completo (todas las fases)
└── migracion_fases/                       # Scripts por fase individuales
    ├── fase_01_ddl_campos.sql            # Fase 1: Crear campos e índices
    ├── fase_02_funcion_fecha.sql         # Fase 2: Función extraer última fecha
    ├── fase_03_funcion_etapa.sql         # Fase 3: Función extraer etapa específica
    ├── fase_04_funcion_calculo.sql       # Fase 4: Función calcular fecha próxima
    ├── fase_05_migracion.sql             # Fase 5: Migración de datos (completa)
    ├── fase_05b_migracion_batch.sql      # Fase 5B: Migración por lotes (alternativa)
    ├── fase_06_triggers.sql              # Fase 6: Crear triggers automáticos
    ├── fase_07_vistas.sql                # Fase 7: Crear vistas de monitoreo
    └── fase_08_validacion.sql            # Fase 8: Validación final y reporte
```

## ⚡ Opciones de Ejecución

### Opción A: Script Completo (Rápido)

Para entornos de desarrollo o testing con pocos registros:

```sql
\i scripts/migracion_fechas_seguimiento_v2.sql
```

### Opción B: Por Fases (Recomendado para Producción)

Ejecutar cada fase individualmente, validando resultados entre cada una.

---

## 🎯 Ejecución Paso a Paso (Opción B)

### ✅ Pre-requisitos

1. **Backup de la base de datos** (obligatorio para producción)
2. **Verificar conectividad** a Supabase/PostgreSQL
3. **Permisos de DDL**: ALTER TABLE, CREATE FUNCTION, CREATE TRIGGER
4. **Horario de mantenimiento** (recomendado para producción)

---

### 🔷 FASE 1: DDL - Crear Campos e Índices

**Tiempo estimado**: < 1 minuto  
**Impacto**: Mínimo (solo metadatos)

```sql
\i scripts/migracion_fases/fase_01_ddl_campos.sql
```

**Verificación esperada**:

- Debe mostrar 2 filas con los campos `fecha_ultimo_seguimiento` y `fecha_proximo_seguimiento`
- Debe mostrar el conteo de registros con `ultimo_seguimiento_raw`

**Si hay errores**:

- Verificar que no existan campos con esos nombres
- Verificar permisos de ALTER TABLE

---

### 🔷 FASE 2: Función - Extraer Última Fecha

**Tiempo estimado**: < 30 segundos  
**Impacto**: Ninguno (solo crea función)

```sql
\i scripts/migracion_fases/fase_02_funcion_fecha.sql
```

**Verificación esperada**:

- Tests deben retornar:
  - Test 1: `2024-12-23`
  - Test 2: `2024-12-23` (última fecha)
  - Test 3: `NULL`

**Si hay errores**:

- Verificar sintaxis PostgreSQL
- Verificar permisos CREATE FUNCTION

---

### 🔷 FASE 3: Función - Extraer Fecha de Etapa

**Tiempo estimado**: < 30 segundos  
**Impacto**: Ninguno (solo crea función)

```sql
\i scripts/migracion_fases/fase_03_funcion_etapa.sql
```

**Verificación esperada**:

- Debe mostrar conteos > 0 para etapas detectadas:
  - Etapa 3 (Ajustador)
  - Etapa 7 (Objeción)
  - Etapa 10 (Desistimiento)
  - Etapa 16 (Pagado)

**Si hay errores**:

- Si todos los conteos son 0, verificar que `ultimo_seguimiento_raw` tenga datos
- Verificar que los keywords coincidan con el formato del texto

---

### 🔷 FASE 4: Función - Calcular Fecha Próxima

**Tiempo estimado**: < 30 segundos  
**Impacto**: Ninguno (solo crea función)

```sql
\i scripts/migracion_fases/fase_04_funcion_calculo.sql
```

**Verificación esperada**:

- Tests deben retornar:
  - Test 1 (Etapa 1): `2024-01-18` (+3 días)
  - Test 2 (Etapa 2): `2024-02-15` (+1 mes)
  - Test 3 (Etapa 13): `2026-01-15` (prescripción ordinaria)

**Verificación de datos**:

- Debe mostrar registros disponibles para cada etapa calculable

**Si hay errores**:

- Verificar que `estado_softseguros` tenga los valores esperados
- Verificar que existan campos `prescripcion_ordinaria` y `prescripcion_extraordinaria`

---

### 🔷 FASE 5: Migración de Datos

**⚠️ IMPORTANTE: Elegir una opción**

#### Opción 5A: Migración Completa (rápida)

**Cuándo usar**: Menos de 50,000 registros en `claims`
**Tiempo estimado**: 1-10 minutos (depende del volumen)
**Impacto**: Bloqueo temporal de tabla durante UPDATE

```sql
\i scripts/migracion_fases/fase_05_migracion.sql
```

#### Opción 5B: Migración por Lotes (recomendada)

**Cuándo usar**: Más de 50,000 registros o producción activa
**Tiempo estimado**: 10-60 minutos (procesa 1000 registros por lote)
**Impacto**: Mínimo, procesa en lotes con pausas

```sql
\i scripts/migracion_fases/fase_05b_migracion_batch.sql
```

**Verificación esperada** (ambas opciones):

- Debe mostrar:
  - Registros actualizados en `fecha_ultimo_seguimiento`
  - Registros con `fecha_proximo_seguimiento` calculada
  - Registros creados/actualizados en `siniestro_etapas`

**Si hay errores**:

- Verificar que las funciones estén creadas (fases 2-4)
- Verificar espacio en disco
- Para timeout, usar opción 5B (por lotes)

---

### 🔷 FASE 6: Triggers Automáticos

**Tiempo estimado**: < 1 minuto  
**Impacto**: Activa actualización en tiempo real

```sql
\i scripts/migracion_fases/fase_06_triggers.sql
```

**Verificación esperada**:

- Debe mostrar 2 triggers:
  - `trg_claims_seguimiento` (UPDATE)
  - `trg_claims_seguimiento_insert` (INSERT)
- Test de trigger debe mostrar "✅ Trigger funcionando correctamente"

**Si hay errores**:

- Verificar que la función `trg_actualizar_seguimiento()` exista
- Verificar permisos CREATE TRIGGER

---

### 🔷 FASE 7: Vistas de Monitoreo

**Tiempo estimado**: < 1 minuto  
**Impacto**: Ninguno (crea vistas de solo lectura)

```sql
\i scripts/migracion_fases/fase_07_vistas.sql
```

**Verificación esperada**:

- Debe mostrar 4 vistas creadas:
  - `vw_seguimientos_alertas`
  - `vw_resumen_migracion`
  - `vw_kpi_etapas`
  - `vw_sin_seguimiento_reciente`
- Tests deben retornar datos (no errores)

**Si hay errores**:

- Verificar que las tablas `claims` y `siniestro_etapas` existan

---

### 🔷 FASE 8: Validación Final

**Tiempo estimado**: 2-5 minutos  
**Impacto**: Ninguno (solo consultas de verificación)

```sql
\i scripts/migracion_fases/fase_08_validacion.sql
```

**Verificación esperada**:

- Checklist debe mostrar "SÍ" en todos los items:
  - ✅ Campos creados
  - ✅ Funciones creadas
  - ✅ Triggers activos
  - ✅ Índices creados
  - ✅ Vistas disponibles
  - ✅ Datos migrados

- Reporte ejecutivo con estadísticas
- Muestra de datos con fechas extraídas
- Mensaje final: "🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE 🎉"

---

## 🎉 Post-Migración

### Verificación Rápida

```sql
-- Ver resumen
SELECT * FROM vw_resumen_migracion;

-- Ver alertas de seguimientos vencidos
SELECT * FROM vw_seguimientos_alertas WHERE estado_alerta = 'VENCIDO';

-- Ver siniestros sin seguimiento reciente
SELECT * FROM vw_sin_seguimiento_reciente WHERE nivel_riesgo = 'CRITICO';
```

### Mantenimiento Programado

Ejecutar mensualmente para cubrir registros importados masivamente:

```sql
-- Actualizar fechas de seguimiento para registros recientes
UPDATE claims
SET fecha_ultimo_seguimiento = extraer_fecha_ultimo_seguimiento(ultimo_seguimiento_raw)
WHERE ultimo_seguimiento_raw IS NOT NULL
  AND (fecha_ultimo_seguimiento IS NULL
       OR updated_at > fecha_ultimo_seguimiento);
```

### Rollback (Emergencia)

Si necesitas revertir la migración:

```sql
-- Eliminar triggers
DROP TRIGGER IF EXISTS trg_claims_seguimiento ON claims;
DROP TRIGGER IF EXISTS trg_claims_seguimiento_insert ON claims;
DROP FUNCTION IF EXISTS trg_actualizar_seguimiento();

-- Eliminar funciones
DROP FUNCTION IF EXISTS extraer_fecha_ultimo_seguimiento(TEXT);
DROP FUNCTION IF EXISTS extraer_fecha_etapa(TEXT, INT);
DROP FUNCTION IF EXISTS calcular_fecha_proximo_seguimiento(DATE, TEXT, DATE, DATE);

-- Eliminar campos (⚠️ Pérdida de datos calculados)
ALTER TABLE claims DROP COLUMN IF EXISTS fecha_ultimo_seguimiento;
ALTER TABLE claims DROP COLUMN IF EXISTS fecha_proximo_seguimiento;

-- Eliminar índices
DROP INDEX IF EXISTS idx_claims_fecha_proximo_vencidos;
DROP INDEX IF EXISTS idx_claims_fecha_proximo_proximos;
DROP INDEX IF EXISTS idx_claims_fecha_ultimo_desc;

-- Eliminar vistas
DROP VIEW IF EXISTS vw_seguimientos_alertas;
DROP VIEW IF EXISTS vw_resumen_migracion;
DROP VIEW IF EXISTS vw_kpi_etapas;
DROP VIEW IF EXISTS vw_sin_seguimiento_reciente;
```

---

## 📊 Troubleshooting

### Error: "column does not exist"

**Causa**: Fase 1 no ejecutada o ejecutada parcialmente  
**Solución**: Ejecutar `fase_01_ddl_campos.sql`

### Error: "function does not exist"

**Causa**: Fases 2-4 no ejecutadas en orden  
**Solución**: Ejecutar fases 2, 3, 4 en orden secuencial

### Error: "timeout durante migración"

**Causa**: Demasiados registros para UPDATE masivo  
**Solución**: Usar `fase_05b_migracion_batch.sql` en lugar de `fase_05_migracion.sql`

### Error: "permission denied"

**Causa**: Permisos insuficientes en la base de datos  
**Solución**: Verificar que el usuario tenga permisos de DDL

### Datos no extraídos (0 registros)

**Causa**: Formato de texto diferente al esperado  
**Solución**: Verificar muestra de `ultimo_seguimiento_raw` y ajustar regex en funciones

---

## 📞 Soporte

Si encuentras problemas no documentados:

1. Revisar logs de PostgreSQL/Supabase
2. Ejecutar `fase_08_validacion.sql` para diagnosticar
3. Verificar muestras de datos con:
   ```sql
   SELECT id_softseguros, LEFT(ultimo_seguimiento_raw, 200)
   FROM claims
   WHERE ultimo_seguimiento_raw IS NOT NULL
   LIMIT 5;
   ```

---

## ✅ Checklist Final

Antes de dar por completada la migración:

- [ ] Backup creado antes de iniciar
- [ ] Fases 1-4 ejecutadas sin errores
- [ ] Fase 5 (migración) completada
- [ ] Fases 6-8 ejecutadas sin errores
- [ ] Validación muestra datos correctos
- [ ] Triggers funcionando (probar actualización)
- [ ] Vistas accesibles y mostrando datos
- [ ] Equipo notificado de la migración
- [ ] Documentación actualizada

---

**¡Éxito con tu migración! 🚀**
