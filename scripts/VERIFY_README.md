# Verificación de Acceso a SQL Functions - Guía Rápida

## 📋 Resumen

Esta verificación confirma que tienes los permisos necesarios para:

- ✅ Crear funciones PostgreSQL optimizadas
- ✅ Crear índices compuestos para KPIs
- ✅ Ejecutar funciones RPC desde el cliente
- ✅ Implementar testing de performance

## 🚀 Opciones de Verificación

### Opción 1: Script TypeScript (Automático)

```bash
# Ejecutar el script de verificación
npx ts-node scripts/verify-supabase-access.ts
```

**Requisitos:**

- Node.js y npm instalados
- Variables en `.env`:
  ```
  VITE_SUPABASE_URL=https://ixmeqfzxeiswstaylqbt.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

**Resultados esperados:**

```
✅ Conexión a Supabase exitosa
✅ Permiso para crear funciones SQL: OK
✅ Ejecución de funciones RPC: OK
✅ Permiso para consultar índices: OK
...
```

### Opción 2: SQL Editor de Supabase (Manual)

Si el script TypeScript falla, usa el SQL Editor:

1. **Abrir SQL Editor:**
   - Ve a: https://supabase.com/dashboard
   - Selecciona tu proyecto
   - Click en "SQL Editor" en el menú lateral

2. **Crear Nueva Query:**
   - Click en "New Query"
   - Pega el contenido de `scripts/verify-supabase-access.sql`

3. **Ejecutar:**
   - Click en "Run" (Ctrl+Enter)
   - Revisa los resultados

**Resultados esperados:**

```
| test_name         | test_result | details                    |
|-------------------|-------------|----------------------------|
| Acceso básico     | ✅ OK       | Conexión exitosa           |
| Permisos CREATE   | ✅ OK       | Permiso para crear...      |
| Tabla: claims     | ✅ OK       | Tabla existe...            |
```

## 🔍 Interpretación de Resultados

### ✅ Todos los tests pasan

¡Perfecto! Puedes proceder con:

1. Crear funciones SQL para KPIs
2. Agregar índices optimizados
3. Setup de testing con k6

### ⚠️ Falla: "Permiso para crear funciones SQL"

**Causa común:** El service role key no tiene permisos CREATE.

**Solución:**

1. Verifica que estás usando `SUPABASE_SERVICE_ROLE_KEY` (no `ANON_KEY`)
2. Ve a Supabase Dashboard → Settings → API
3. Confirma que el service role key es válido
4. Si persiste, contacta al administrador del proyecto

### ⚠️ Falla: "Conexión básica"

**Causa común:** Problemas de red o credenciales.

**Verificar:**

```bash
# Test de conectividad
curl -I https://ixmeqfzxeiswstaylqbt.supabase.co

# Debe retornar HTTP 200
```

## 📊 Próximos Pasos

Si la verificación es exitosa, continuamos con:

### Fase 1: Optimización SQL (2 días)

1. Crear función `get_kpi_overview_optimized()`
2. Agregar índices compuestos
3. Refactorizar KpiService

### Fase 2: Performance Testing (1 día)

1. Instalar k6: `docker pull grafana/k6`
2. Crear script de seed con 10k siniestros
3. Ejecutar benchmarks

### Fase 3: Validación

1. Comparar métricas antes/después
2. Validar contra SLAs de negocio
3. Documentar resultados

## 🆘 Troubleshooting

### Error: "Cannot find module '@supabase/supabase-js'"

```bash
npm install @supabase/supabase-js dotenv
```

### Error: "Missing Supabase environment variables"

Verifica que `.env` existe en la raíz del proyecto con:

```bash
VITE_SUPABASE_URL=https://ixmeqfzxeiswstaylqbt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_key_aqui
```

### Error: "permission denied for table pg_indexes"

Esto es normal con el anon key. Asegúrate de usar el service role key.

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs del script
2. Intenta la Opción 2 (SQL Editor)
3. Documenta el error específico

## ✅ Checklist Pre-Optimización

Antes de empezar la optimización, asegúrate de:

- [ ] Script de verificación ejecutado exitosamente
- [ ] Acceso confirmado a crear funciones SQL
- [ ] Acceso confirmado a crear índices
- [ ] Tablas críticas verificadas (claims, siniestro_etapas)
- [ ] Backup de base de datos creado (recomendado)

---

**Nota:** La verificación es no-destructiva. No modifica datos existentes.
