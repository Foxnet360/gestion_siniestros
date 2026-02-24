# CORREGIR API KEY DE SUPABASE

## ❌ Error Actual

Tu `.env` tiene una **Publishable Key** que NO sirve para el cliente de Supabase.

## ✅ Obtener la Key Correcta

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a: **"Project Settings"** (icono ⚙️) → **"API"**
4. Copia el valor de **"anon public"** bajo "Project API keys"
   - Se ve así: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4amV1eW91aGhocHR3cmxsdnZ6aCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjE5MDAwMDAwMDB9.xxxxxxxx`

## 📝 Actualizar Archivo

Edita el archivo `.env`:

```env
VITE_SUPABASE_URL=https://yxjeuyouhhhptwrllvzh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (tu key anon real)
```

## 🔄 Reconstruir

```bash
npm run build
```

## 📦 Crear nuevo ZIP

Después de corregir la key, crea un nuevo build y súbelo a Hostinger.

---

## 🔍 Verificación

Abre la consola del navegador (F12) y busca la petición a:
`https://yxjeuyouhhhptwrllvzh.supabase.co/rest/v1/claims`

Debe retornar **200 OK** (no 401).
