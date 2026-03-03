# 🔧 SOLUCIÓN DEFINITIVA - Crear Usuario de Login

## ❌ PROBLEMA

Los scripts SQL no están creando usuarios en `auth.users`. Esto puede deberse a:

- Permisos insuficientes
- Errores silenciosos en bloques PL/pgSQL
- Configuración de Supabase

## ✅ SOLUCIÓN RECOMENDADA: Crear usuario desde el Dashboard

Esta es la forma **más confiable** y **rápida**:

### PASO 1: Crear usuario en Dashboard

1. **Abre Supabase Dashboard**
2. **Ve a Authentication** (en el menú lateral izquierdo)
3. **Haz clic en "Users"**
4. **Haz clic en "Add user"** (botón verde arriba a la derecha)
5. **Selecciona "Create new user"**
6. **Completa los campos:**
   - **Email:** `indemnizaciones@correseguros.co`
   - **Password:** `SGS123456`
   - ✅ **Auto-confirm user:** (MARCAR esta casilla)
   - **User Metadata:** (Opcional, clic en "Add metadata")
     - Key: `name` → Value: `Maryory Espinosa Sánchez`
     - Key: `role` → Value: `ADMIN`
7. **Haz clic en "Create user"**

### PASO 2: Insertar en tabla public.users

Después de crear el usuario en el paso 1, ejecuta **solo este comando SQL** en SQL Editor:

```sql
-- Insertar el usuario en public.users
INSERT INTO users (id, email, name, role, initials, is_active, created_at, updated_at)
SELECT
    id,
    email,
    'Maryory Espinosa Sánchez',
    'ADMIN',
    'MES',
    true,
    NOW(),
    NOW()
FROM auth.users
WHERE email = 'indemnizaciones@correseguros.co';
```

### PASO 3: Verificar

1. **Ve a Authentication > Users**
2. **Debes ver el email:** `indemnizaciones@correseguros.co`
3. **Ve a Table Editor > users**
4. **Debes ver el registro con el mismo email**

### PASO 4: Probar login

1. **Refresca la app** (F5)
2. **Ingresa:**
   - Email: `indemnizaciones@correseguros.co`
   - Contraseña: `SGS123456`
3. **Debe funcionar!** 🎉

---

## 🆘 Si aún no funciona...

### Opción 2: Desactivar RLS completamente (Temporal)

Ejecuta en SQL Editor:

```sql
-- Desactivar RLS permanentemente
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas
DROP POLICY IF EXISTS "Allow all operations" ON users;
DROP POLICY IF EXISTS "Allow select for all" ON users;
DROP POLICY IF EXISTS "Allow modify for authenticated" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admin can manage all users" ON users;
DROP POLICY IF EXISTS "Manager can view all users" ON users;

-- Verificar
SELECT 'RLS Desactivado ✅' as estado;
```

Después de esto, prueba el login nuevamente.

---

## 📋 Scripts disponibles

Si prefieres intentar con SQL primero:

1. **`scripts/fix-definitivo.sql`** - Script completo automático
2. **`scripts/plan-b-manual.sql`** - Comandos individuales paso a paso

---

## 🔑 Datos de Login una vez creado

**Email:** `indemnizaciones@correseguros.co`  
**Contraseña:** `SGS123456`  
**Rol:** ADMIN

---

## ❓ ¿Por qué fallaron los scripts anteriores?

Los scripts SQL pueden fallar porque:

1. **auth.users** es una tabla protegida del sistema
2. Necesita permisos especiales para insertar directamente
3. El dashboard de Supabase usa la API oficial que sí tiene permisos

**La forma más confiable es usar el botón "Add user" del Dashboard.**

---

## 🎯 Resumen

**Ruta más rápida (2 minutos):**

1. Dashboard → Authentication → Users → Add user
2. SQL Editor → Ejecutar INSERT para public.users
3. Refrescar app → Login

**¿Necesitas ayuda con algún paso?** Cuéntame qué error ves.
