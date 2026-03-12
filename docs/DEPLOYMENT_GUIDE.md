# Guía de Deployment - Sistema SLA y Dashboard KPIs

## Índice

1. [Pre-requisitos](#pre-requisitos)
2. [Deployment de Base de Datos](#deployment-de-base-de-datos)
3. [Migración de Datos](#migración-de-datos)
4. [Deployment de Backend](#deployment-de-backend)
5. [Deployment de Frontend](#deployment-de-frontend)
6. [Monitoreo](#monitoreo)
7. [Rollback](#rollback)

---

## Pre-requisitos

### Verificaciones Previas

- [ ] Backup completo de base de datos
- [ ] Variables de entorno configuradas en producción
- [ ] Feature flags deshabilitados (`VITE_FEATURE_DASHBOARD=false`)
- [ ] Plan de rollback definido
- [ ] Equipo de soporte notificado

### Variables de Entorno Requeridas

```env
# Supabase (existentes)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Feature Flags (inicialmente deshabilitados)
VITE_FEATURE_DASHBOARD=false
VITE_FEATURE_ADVANCED_FILTERS=false
VITE_FEATURE_EXPORT_PDF=false
VITE_FEATURE_REALTIME=false
```

---

## Deployment de Base de Datos

### Paso 1: Crear Backup

```bash
# Crear backup completo antes de cualquier cambio
pg_dump -h your-host -U your-user -d your-database > backup_pre_sla_$(date +%Y%m%d_%H%M%S).sql
```

### Paso 2: Ejecutar Migraciones

**Orden de ejecución:**

```sql
-- 1. Tabla de etapas
\i migrations/004_create_siniestro_etapas.sql

-- 2. Índices optimizados
\i migrations/005_add_siniestro_etapas_indexes.sql

-- 3. Tabla junction de amparos
\i migrations/006_create_claim_amparos_junction.sql

-- 4. Trigger de extracción automática
\i migrations/007_create_sla_trigger.sql
```

### Paso 3: Verificar Migraciones

```sql
-- Verificar que las tablas existen
SELECT tablename FROM pg_tables WHERE tablename IN ('siniestro_etapas', 'claim_amparos');

-- Verificar que el trigger existe
SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'trigger_process_sla_extraction';

-- Verificar índices
SELECT indexname FROM pg_indexes WHERE tablename = 'siniestro_etapas';
```

---

## Migración de Datos

### Paso 1: Preparar Script de Migración

```bash
# Configurar variables de entorno para el script
export VITE_SUPABASE_URL=your-production-url
export VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Verificar conexión
npx ts-node scripts/test-connection.ts
```

### Paso 2: Ejecutar Migración en Modo Prueba

```bash
# Ejecutar con límite de 10 siniestros para prueba
npx ts-node -e "
const { SlaBatchProcessor } = require('./src/services/SlaBatchProcessor');
const processor = new SlaBatchProcessor(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
processor.processAll(10).then(console.log).catch(console.error);
"
```

### Paso 3: Ejecutar Migración Completa

```bash
# Ejecutar migración completa
npx ts-node scripts/migrate-sla-data.ts

# O usar el procesador directamente
npx ts-node -e "
const { SlaBatchProcessor } = require('./src/services/SlaBatchProcessor');
const processor = new SlaBatchProcessor(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
processor.processAll().then(summary => {
  console.log('Migration completed:', summary);
  process.exit(0);
}).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
"
```

### Paso 4: Validar Migración

```sql
-- Contar siniestros procesados
SELECT COUNT(*) as total FROM siniestro_etapas WHERE is_active = true;

-- Verificar cobertura por etapa
SELECT
  COUNT(CASE WHEN etapa_1_fecha IS NOT NULL THEN 1 END) as stage_1,
  COUNT(CASE WHEN etapa_2_fecha IS NOT NULL THEN 1 END) as stage_2,
  COUNT(CASE WHEN etapa_6_fecha IS NOT NULL THEN 1 END) as stage_6,
  COUNT(CASE WHEN etapa_10_fecha IS NOT NULL THEN 1 END) as stage_10,
  COUNT(CASE WHEN etapa_15_fecha IS NOT NULL THEN 1 END) as stage_15,
  COUNT(CASE WHEN etapa_16_fecha IS NOT NULL THEN 1 END) as stage_16,
  COUNT(*) as total
FROM siniestro_etapas;

-- Revisar errores de extracción
SELECT
  claim_id,
  extraction_errors
FROM siniestro_etapas
WHERE array_length(extraction_errors, 1) > 0
LIMIT 10;
```

---

## Deployment de Backend

### Paso 1: Verificar Builds

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Tests
npm run test
```

### Paso 2: Build de Producción

```bash
# Construir para producción
npm run build

# Verificar que el build fue exitoso
ls -la dist/
```

### Paso 3: Deploy

**Opción A: Deploy en Servidor Propio**

```bash
# Copiar archivos al servidor
rsync -avz dist/ user@server:/var/www/sgs/

# Reiniciar servicio
ssh user@server "sudo systemctl restart sgs"
```

**Opción B: Deploy en Netlify/Vercel**

```bash
# Netlify
netlify deploy --prod --dir=dist

# Vercel
vercel --prod
```

---

## Deployment de Frontend

### Paso 1: Build de Producción

```bash
# Asegurar que feature flags están deshabilitados
# VITE_FEATURE_DASHBOARD=false en .env.production

# Build
npm run build

# Verificar bundle size
ls -lh dist/assets/
```

### Paso 2: Deploy

```bash
# Subir a CDN o hosting estático
# Ejemplo con AWS S3:
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidar cache de CloudFront
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

---

## Monitoreo

### Métricas a Monitorear

1. **Errores de Extracción**

```sql
-- Contar errores por hora
SELECT
  DATE_TRUNC('hour', updated_at) as hour,
  COUNT(*) as error_count
FROM siniestro_etapas
WHERE array_length(extraction_errors, 1) > 0
  AND updated_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

2. **Performance de Queries**

```sql
-- Verificar tiempos de ejecución
EXPLAIN ANALYZE
SELECT AVG(etapa_16_fecha - etapa_1_fecha)
FROM siniestro_etapas
WHERE etapa_1_fecha IS NOT NULL AND etapa_16_fecha IS NOT NULL;
```

3. **Uso de Caché**

```bash
# Verificar hits de caché
curl https://api.yoursite.com/api/kpis/cache/stats
```

### Alertas Configuradas

- **Error rate > 5%**: Notificar al equipo
- **Query time > 2s**: Revisar índices
- **Cache hit rate < 50%**: Revisar TTL

---

## Activación del Dashboard

### Paso 1: Verificación Previa

```bash
# Verificar que todo funciona correctamente
curl https://api.yoursite.com/api/kpis/overview | jq

# Verificar que no hay errores en logs
tail -f /var/log/sgs/error.log
```

### Paso 2: Habilitar Feature Flag

```bash
# Actualizar variable de entorno
VITE_FEATURE_DASHBOARD=true

# Redeploy solo si es necesario (variables de entorno)
# O actualizar en panel de control (Vercel/Netlify)
```

### Paso 3: Verificar Acceso

- [ ] Dashboard carga sin errores
- [ ] KPIs se muestran correctamente
- [ ] Filtros funcionan
- [ ] Gráficos se renderizan
- [ ] Exportación CSV funciona

---

## Rollback

### Escenario 1: Rollback Inmediato

```bash
# Deshabilitar feature flag
VITE_FEATURE_DASHBOARD=false

# Redeploy frontend
```

### Escenario 2: Rollback Completo

```bash
# 1. Restaurar backup de base de datos
psql -h your-host -U your-user -d your-database < backup_pre_sla_YYYYMMDD_HHMMSS.sql

# 2. Restaurar código anterior
git checkout previous-tag
npm run build
npm run deploy

# 3. Limpiar caché
curl -X POST https://api.yoursite.com/api/kpis/cache/clear
```

### Checklist de Rollback

- [ ] Backup restaurado
- [ ] Código anterior deployado
- [ ] Caché limpiado
- [ ] Usuarios notificados
- [ ] Logs revisados

---

## Post-Deployment

### Día 1: Monitoreo Intensivo

- [ ] Revisar logs cada 2 horas
- [ ] Verificar métricas de performance
- [ ] Confirmar que extracción funciona
- [ ] Revisar errores de usuarios

### Semana 1: Optimización

- [ ] Analizar queries lentas
- [ ] Ajustar TTL de caché si es necesario
- [ ] Revisar cobertura de extracción
- [ ] Optimizar índices si es necesario

### Mes 1: Estabilización

- [ ] Documentar issues encontrados
- [ ] Planear mejoras
- [ ] Capacitar usuarios
- [ ] Recopilar feedback

---

## Contactos de Emergencia

- **DevOps**: [nombre] - [teléfono]
- **DBA**: [nombre] - [teléfono]
- **Líder Técnico**: [nombre] - [teléfono]
- **Equipo de Soporte**: [email]

---

## Recursos Adicionales

- **Documentación API**: `/docs/api/kpi-endpoints.md`
- **Guía de Usuario**: `/docs/user-guide-dashboard.md`
- **Lógica de Extracción**: `/docs/stage-extraction-logic.md`
- **Queries SQL**: `/docs/sql/kpi-queries.sql`

---

**Última actualización**: Marzo 2024  
**Versión**: 1.0  
**Responsable**: [Nombre del equipo]
