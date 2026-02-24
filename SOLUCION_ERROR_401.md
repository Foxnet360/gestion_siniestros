# SOLUCIÓN ERROR 401 - SUPABASE

## 🔴 Problema

Error 401 Unauthorized al conectar con Supabase

## ✅ Solución Paso a Paso

### Paso 1: Verificar Variables de Entorno en Hostinger

**Opción A - Panel de Hostinger:**

1. Ve a tu panel de Hostinger (hPanel)
2. Navega a: **"Sitios Web"** → **"Gestor de Archivos"**
3. Ve a la carpeta donde está desplegada tu app (ej: `public_html/`)
4. Crea un archivo llamado `.env` (si no existe)
5. Añade estas líneas:

```env
VITE_SUPABASE_URL=https://yxjeuyouhhhptwrllvzh.supabase.co
VITE_SUPABASE_ANON_KEY=sbp_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4amV1eW91aGhocHR3cmxsdnZ6aCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjE5MDAwMDAwMDB9.xxxxxxxx
```

**⚠️ IMPORTANTE:** Reemplaza `VITE_SUPABASE_ANON_KEY` con tu clave real de Supabase.

**Opción B - Variables de Entorno en hPanel:**

1. Ve a: **"Avanzado"** → **"Variables de entorno"** (si está disponible)
2. Añade:
   - `VITE_SUPABASE_URL`: `https://yxjeuyouhhhptwrllvzh.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: tu clave anónima

### Paso 2: Obtener tu API Key de Supabase

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a: **"Project Settings"** (icono de engranaje) → **"API"**
4. Copia el valor de **"anon public"** (Project API keys)
   - Se ve algo así: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Paso 3: Verificar Políticas RLS (Row Level Security)

El error 401 puede ser por las políticas de seguridad. Ejecuta esto en Supabase SQL Editor:

```sql
-- Desactivar temporalmente RLS para pruebas (NO RECOMENDADO PARA PRODUCCIÓN)
ALTER TABLE claims DISABLE ROW LEVEL SECURITY;

-- O permitir lectura anónima (para pruebas)
CREATE POLICY "Allow anonymous read" ON claims
    FOR SELECT USING (true);
```

**Para producción segura, usa el archivo `supabase_rls_policies.sql` que generé.**

### Paso 4: Redesplegar la Aplicación

**Sube el archivo:** `sgs-deploy-hostinger-v2.zip` (nuevo build con Tailwind corregido)

1. Elimina todo el contenido actual de `public_html/`
2. Sube `sgs-deploy-hostinger-v2.zip`
3. Extrae el archivo
4. Asegúrate de que `.htaccess` está presente

### Paso 5: Verificar CORS en Supabase

1. En Supabase Dashboard → **"Authentication"** → **"Providers"**
2. Añade tu dominio de Hostinger a **"Site URL"**:
   - `https://tudominio.com`
   - `https://www.tudominio.com`
3. Guarda cambios

### Paso 6: Probar Conexión

Abre la consola del navegador (F12) y verifica:

- No debe haber errores 401
- La petición a Supabase debe retornar 200

---

## 🔧 Alternativa: Hardcodear Variables (Temporal)

Si Hostinger no permite variables de entorno, edita `lib/supabase.ts`:

```typescript
// Reemplaza esto:
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Por esto (TEMPORAL):
const supabaseUrl = 'https://yxjeuyouhhhptwrllvzh.supabase.co';
const supabaseKey = 'tu_clave_real_aqui';
```

**⚠️ ADVERTENCIA:** No recomendado para producción con claves sensibles.

---

## 📋 Checklist de Verificación

- [ ] Variables de entorno configuradas en Hostinger
- [ ] API Key de Supabase es correcta (no expirada)
- [ ] RLS policies permiten lectura
- [ ] Dominio añadido a CORS en Supabase
- [ ] Archivo `.env` tiene los nombres correctos (VITE\_ prefix)
- [ ] Build incluye las variables (recompilar si se cambian)

---

## ❓ Si sigue sin funcionar

1. **Prueba localmente primero:**

   ```bash
   npm run dev
   ```

   Si funciona localmente pero no en Hostinger, es problema de variables de entorno.

2. **Verifica Network tab:**
   - Abre DevTools (F12) → Network
   - Busca la petición a `supabase.co/rest/v1/claims`
   - Revisa el header `Authorization` - debe tener `Bearer eyJhbG...`

3. **Contacta a Hostinger:**
   - Pregunta cómo configurar variables de entorno en tu plan
   - Algunos planes compartidos no lo soportan
