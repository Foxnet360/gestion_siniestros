# Deploy de Edge Function auto-closures

## Prerrequisitos

1. Supabase CLI instalado: `npm install -g supabase`
2. Login en Supabase: `supabase login`
3. Variables de entorno configuradas en `.env`:
   ```
   VITE_SUPABASE_URL=tu-url
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   ```

## Pasos de Deploy

### 1. Deploy de la Edge Function

```bash
# Desde la raíz del proyecto
supabase functions deploy auto-closures

# Verificar que se deployó correctamente
supabase functions list
```

### 2. Configurar Variables de Entorno

En el Dashboard de Supabase:

1. Ir a Project Settings > Functions
2. Agregar las siguientes variables:
   ```
   SUPABASE_URL=https://<tu-project-ref>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>
   ```

### 3. Configurar Cron Job

Ejecutar el SQL en el Editor de Supabase:

```sql
-- Crear extensión pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Crear el cron job
SELECT cron.schedule(
    'daily-auto-closures',
    '0 2 * * *',
    $$SELECT net.http_get(
        url:='https://<tu-project-ref>.supabase.co/functions/v1/auto-closures',
        headers:='{"Authorization": "Bearer <tu-anon-key>"}'::jsonb
    )$$;
);

-- Verificar
SELECT * FROM cron.job;
```

### 4. Probar la Función

```bash
# Invocar manualmente
npx ts-node scripts/test-auto-closures.ts

# O usando curl
curl -i --location --request POST 'https://<tu-project-ref>.supabase.co/functions/v1/auto-closures' \
  --header 'Authorization: Bearer <tu-anon-key>' \
  --header 'Content-Type: application/json'
```

### 5. Verificar Logs

```bash
# Ver logs en tiempo real
supabase functions logs auto-closures --tail

# O en el Dashboard:
# Dashboard > Edge Functions > auto-closures > Logs
```

## Comandos Útiles

```bash
# Redeploy (actualizar función)
supabase functions deploy auto-closures

# Eliminar función
supabase functions delete auto-closures

# Ver logs
supabase functions logs auto-closures

# Invocar localmente (para desarrollo)
supabase functions serve auto-closures
```

## Troubleshooting

### Error: "Failed to send a request to the Edge Function"

- Verificar que la función está deployada: `supabase functions list`
- Verificar la URL del proyecto
- Verificar que el anon-key es correcto

### Error: "Missing Supabase environment variables"

- Configurar variables en Dashboard > Project Settings > Functions

### El cron job no ejecuta

- Verificar que pg_cron está habilitado: `SELECT * FROM pg_extension WHERE extname = 'pg_cron'`
- Verificar jobs activos: `SELECT * FROM cron.job`
- Verificar logs de cron: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC`

## Monitoreo

Los resultados de cada ejecución se guardan en `processing_reports`:

```sql
-- Últimos reportes
SELECT * FROM processing_reports ORDER BY timestamp DESC LIMIT 5;

-- Resumen diario
SELECT * FROM daily_processing_summary LIMIT 7;

-- Tasa de éxito
SELECT
    COUNT(*) as total,
    SUM(CASE WHEN total_errors = 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as tasa_exito
FROM processing_reports
WHERE timestamp > NOW() - INTERVAL '30 days';
```
