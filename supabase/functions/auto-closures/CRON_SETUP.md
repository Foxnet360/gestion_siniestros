# Configuración de Cron para Edge Function

# Este archivo contiene las instrucciones para configurar el cron job en Supabase

## Método 1: Configuración via SQL (Recomendado)

Ejecutar en el SQL Editor de Supabase:

```sql
-- Crear extensión pg_cron si no existe
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Crear el cron job para ejecutar la función diariamente a las 2:00 AM
SELECT cron.schedule(
    'daily-auto-closures',           -- nombre del job
    '0 2 * * *',                     -- cron expression: 2:00 AM diario
    $$SELECT net.http_get(
        url:='https://<project-ref>.supabase.co/functions/v1/auto-closures',
        headers:='{"Authorization": "Bearer <anon-key>", "Content-Type": "application/json"}'::jsonb
    ) AS request_id;$$
);

-- Verificar que el job fue creado
SELECT * FROM cron.job;

-- Para desactivar el job:
-- SELECT cron.unschedule('daily-auto-closures');

-- Para reactivar:
-- SELECT cron.schedule('daily-auto-closures', '0 2 * * *', ...);
```

## Método 2: Configuración via Dashboard

1. Ir a Dashboard de Supabase > Database > Extensions
2. Habilitar "pg_cron"
3. Ir a SQL Editor
4. Ejecutar el SQL de arriba

## Método 3: Configuración via Supabase CLI

```bash
# Configurar cron job usando supabase
supabase secrets set CRON_SECRET=su-secreto-seguro

# Luego ejecutar el SQL desde el CLI
supabase db execute --file cron-setup.sql
```

## Variables de Entorno Necesarias

En el Dashboard de Supabase > Project Settings > Functions:

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

## Comando para Invocar Manualmente

```bash
# Usando curl
curl -i --location --request POST 'https://<project-ref>.supabase.co/functions/v1/auto-closures' \
  --header 'Authorization: Bearer <anon-key>' \
  --header 'Content-Type: application/json'

# Usando Supabase CLI
supabase functions invoke auto-closures
```

## Monitoreo

Los logs de la Edge Function están disponibles en:

- Dashboard de Supabase > Edge Functions > auto-closures > Logs
- O via CLI: `supabase functions logs auto-closures`

## Reportes de Procesamiento

Los resultados de cada ejecución se guardan en la tabla `processing_reports`:

```sql
-- Ver últimos reportes
SELECT * FROM processing_reports
ORDER BY timestamp DESC
LIMIT 10;

-- Estadísticas de éxito
SELECT
    DATE(timestamp) as fecha,
    COUNT(*) as total_ejecuciones,
    SUM(CASE WHEN total_errors = 0 THEN 1 ELSE 0 END) as exitosas,
    SUM(alerts_updated) as total_alertas_actualizadas,
    SUM(closures_auto) as total_cierres_automaticos
FROM processing_reports
GROUP BY DATE(timestamp)
ORDER BY fecha DESC;
```

## Troubleshooting

### Error: "Failed to send a request to the Edge Function"

- Verificar que la función está deployada: `supabase functions list`
- Verificar URL del proyecto
- Verificar que el anon-key es correcto

### Error: "Missing Supabase environment variables"

- Verificar que SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY están configurados
- Ir a Dashboard > Project Settings > Functions > Environment Variables

### El cron job no ejecuta

- Verificar que pg_cron está habilitado: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`
- Verificar jobs activos: `SELECT * FROM cron.job;`
- Verificar logs de cron: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`

### Errores de timeout

- La función tiene un límite de 400s (6.6 minutos)
- Si se excede, considerar procesar en batches más pequeños
- Verificar la cantidad de siniestros activos

## Notas de Seguridad

1. Nunca exponer el SERVICE_ROLE_KEY en el frontend
2. Usar RLS policies para proteger processing_reports
3. Considerar agregar autenticación adicional si es necesario
4. Monitorear logs regularmente para detectar anomalías
