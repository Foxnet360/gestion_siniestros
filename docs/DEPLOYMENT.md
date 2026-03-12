# Deployment Guide - Sistema de Cálculo Automático de Fechas

## Índice

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Steps](#deployment-steps)
3. [Feature Flag Management](#feature-flag-management)
4. [Rollback Procedures](#rollback-procedures)
5. [Post-Deployment Verification](#post-deployment-verification)

---

## Pre-Deployment Checklist

### ✅ Código y Tests

- [ ] Todos los tests unitarios pasan (`npm test`)
- [ ] Tests de integración pasan
- [ ] No hay errores de TypeScript (`npx tsc --noEmit`)
- [ ] Linting pasa sin errores (`npm run lint`)
- [ ] Código revisado y aprobado (PR mergeado)

### ✅ Base de Datos

- [ ] Migraciones SQL creadas y probadas
- [ ] Scripts de rollback preparados
- [ ] Datos de prueba cargados en staging

### ✅ Configuración

- [ ] Variables de entorno configuradas
- [ ] Feature flag creado (AUTO_FOLLOWUP_ENABLED = false)
- [ ] Configuración de negocio por defecto lista

### ✅ Infraestructura

- [ ] Edge Function lista para deploy
- [ ] Cron job configurado en Supabase
- [ ] Backup de producción realizado

---

## Deployment Steps

### Paso 1: Deploy de Base de Datos (5 minutos)

```bash
# 1.1 Ejecutar migraciones en orden
psql $DATABASE_URL -f database/migrations/001_create_app_config.sql
psql $DATABASE_URL -f database/migrations/002_add_prescription_columns.sql
psql $DATABASE_URL -f database/migrations/003_create_prescription_functions.sql
psql $DATABASE_URL -f database/migrations/004_create_processing_reports.sql
psql $DATABASE_URL -f database/migrations/005_create_user_preferences.sql
psql $DATABASE_URL -f database/migrations/006_add_feature_flags.sql

# 1.2 Verificar migraciones
psql $DATABASE_URL -c "\dt"
psql $DATABASE_URL -c "SELECT * FROM app_config;"
```

**Verificación:**

- Tabla `app_config` creada con 6 registros iniciales
- Columnas `alert_level`, `fecha_prescripcion_ordinaria`, `fecha_prescripcion_extraordinaria` en tabla `claims`
- Función `is_feature_enabled` disponible

### Paso 2: Deploy de Edge Function (3 minutos)

```bash
# 2.1 Deploy de la función
supabase functions deploy process-auto-closures

# 2.2 Configurar variables de entorno para la función
supabase secrets set --env-file ./supabase/.env.production

# 2.3 Verificar deploy
supabase functions list
```

**Verificación:**

- Función `process-auto-closures` aparece en la lista
- Estado: `Healthy`

### Paso 3: Configurar Cron Job (2 minutos)

```sql
-- 3.1 Configurar cron job en Supabase Dashboard
-- O ejecutar desde SQL Editor:

SELECT cron.schedule(
  'process-auto-closures-daily',
  '0 2 * * *',  -- Todos los días a las 2:00 AM
  $$
  SELECT net.http_get(
    url:='https://[PROJECT_REF].supabase.co/functions/v1/process-auto-closures',
    headers:='{"Authorization": "Bearer [SERVICE_ROLE_KEY]", "Content-Type": "application/json"}'::jsonb
  ) AS request_id;
  $$
);

-- 3.2 Verificar cron job
SELECT * FROM cron.job;
```

**Verificación:**

- Job `process-auto-closures-daily` aparece en la lista
- Schedule: `0 2 * * *`

### Paso 4: Deploy de Backend Services (5 minutos)

```bash
# 4.1 Build del proyecto
npm run build

# 4.2 Verificar build exitoso
ls -la dist/

# 4.3 Deploy (según tu infraestructura)
# Para Netlify:
netlify deploy --prod --dir=dist

# Para Vercel:
vercel --prod

# Para servidor propio:
rsync -avz dist/ user@server:/var/www/app/
```

### Paso 5: Deploy de Frontend (5 minutos)

```bash
# 5.1 Mismo build que backend (si es SPA)
npm run build

# 5.2 Deploy
# El frontend se despliega junto con el backend en proyectos Vite
```

### Paso 6: Migración de Datos (10-30 minutos)

```bash
# 6.1 Ejecutar script de migración en modo dry-run primero
npx ts-node scripts/migrate-prescription-dates.ts --dry-run

# 6.2 Si todo OK, ejecutar migración real
npx ts-node scripts/migrate-prescription-dates.ts

# 6.3 Ejecutar script de inicialización de alertas
npx ts-node scripts/migrate-auto-followup.ts
```

**Verificación:**

- Reporte de migración generado
- Todas las filas tienen `fecha_prescripcion_ordinaria` calculada
- Alertas inicializadas

---

## Feature Flag Management

### Estado Inicial (Después del Deploy)

```sql
-- Verificar estado del feature flag
SELECT config_value->>'AUTO_FOLLOWUP_ENABLED' as enabled
FROM app_config
WHERE config_key = 'feature_flags';
-- Resultado: false
```

### Activar para Usuarios Beta

```sql
-- Agregar usuarios beta
UPDATE app_config
SET config_value = jsonb_set(
  config_value,
  '{AUTO_FOLLOWUP_BETA_USERS}',
  '["uuid-usuario-1", "uuid-usuario-2"]'::jsonb
)
WHERE config_key = 'feature_flags';

-- O desde la aplicación:
-- Usar el componente BusinessRulesConfig para gestionar beta users
```

### Rollout Gradual (por porcentaje)

```sql
-- Activar para 10% de usuarios
UPDATE app_config
SET config_value = jsonb_set(
  config_value,
  '{AUTO_FOLLOWUP_ROLLOUT_PERCENTAGE}',
  '10'::jsonb
)
WHERE config_key = 'feature_flags';

-- Aumentar gradualmente:
-- 10% -> 25% -> 50% -> 75% -> 100%
```

### Activar Globalmente

```sql
-- Activar para todos los usuarios
UPDATE app_config
SET config_value = jsonb_set(
  config_value,
  '{AUTO_FOLLOWUP_ENABLED}',
  'true'::jsonb
)
WHERE config_key = 'feature_flags';
```

### Desactivar (Emergencia)

```sql
-- Desactivar inmediatamente
UPDATE app_config
SET config_value = jsonb_set(
  config_value,
  '{AUTO_FOLLOWUP_ENABLED}',
  'false'::jsonb
)
WHERE config_key = 'feature_flags';

-- Esto afecta inmediatamente a todos los usuarios
```

---

## Rollback Procedures

### Escenario 1: Error Crítico Detectado

```bash
# Paso 1: Desactivar feature flag inmediatamente
# (Ejecutar SQL de emergencia arriba)

# Paso 2: Rollback de migración de datos (si es necesario)
npx ts-node scripts/rollback-auto-followup.ts

# Paso 3: Notificar al equipo
# - Enviar mensaje a Slack #incidents
# - Crear ticket en sistema de tickets
```

### Escenario 2: Rollback Completo

```bash
# Paso 1: Revertir deploy de frontend/backend
# (Depende de tu infraestructura)
git revert HEAD
npm run build
# Redeploy...

# Paso 2: Revertir migraciones de BD
psql $DATABASE_URL -f database/rollback/rollback_006.sql
psql $DATABASE_URL -f database/rollback/rollback_005.sql
# ... etc

# Paso 3: Restaurar backup si es necesario
# pg_restore --dbname=$DATABASE_URL backup_pre_deploy.sql
```

### Checklist de Rollback

- [ ] Feature flag desactivado
- [ ] Usuarios notificados (mensaje en app)
- [ ] Datos revertidos (si es necesario)
- [ ] Código revertido a versión anterior
- [ ] Tests ejecutados para verificar rollback
- [ ] Post-mortem programado

---

## Post-Deployment Verification

### Verificación Inmediata (0-5 minutos)

```bash
# 1. Verificar que la aplicación carga
curl -I https://tu-app.com
# HTTP/2 200

# 2. Verificar que la API responde
curl https://tu-app.com/api/health
# {"status": "ok", "version": "1.0.0"}

# 3. Verificar conexión a BD
psql $DATABASE_URL -c "SELECT COUNT(*) FROM claims;"
```

### Verificación de Funcionalidad (5-15 minutos)

- [ ] Crear siniestro de prueba
- [ ] Verificar que se calcula fecha de seguimiento
- [ ] Verificar que se calcula fecha de prescripción
- [ ] Cambiar estado y verificar recálculo
- [ ] Verificar alertas en Dashboard

### Verificación de Edge Function (15-30 minutos)

```bash
# Ejecutar Edge Function manualmente para prueba
curl -X POST \
  https://[PROJECT_REF].supabase.co/functions/v1/process-auto-closures \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Verificar logs
supabase functions logs process-auto-closures
```

### Monitoreo Continuo (24-48 horas)

Verificar métricas en Supabase Dashboard:

- Error rates de Edge Function
- Query performance en app_config
- Número de siniestros procesados
- Alertas generadas

---

## Notas Importantes

### Tiempo Estimado Total

| Paso                 | Tiempo Estimado |
| -------------------- | --------------- |
| Pre-deployment       | 30 min          |
| Database migrations  | 5 min           |
| Edge Function deploy | 3 min           |
| Cron job config      | 2 min           |
| Backend deploy       | 5 min           |
| Frontend deploy      | 5 min           |
| Data migration       | 10-30 min       |
| Verificación         | 15 min          |
| **Total**            | **~75-95 min**  |

### Ventana de Mantenimiento

Recomendado: **Sábado 2:00 AM - 4:00 AM** (bajo tráfico)

### Contactos de Emergencia

- **Tech Lead**: +1-555-0100
- **DBA**: +1-555-0101
- **DevOps**: +1-555-0102

---

**Documento creado**: Marzo 2026  
**Última actualización**: Marzo 2026  
**Versión**: 1.0
