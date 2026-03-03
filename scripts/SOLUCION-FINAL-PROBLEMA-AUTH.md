# 🔴 SOLUCIÓN FINAL - Problema de Creación de Usuarios

## ❌ DIAGNÓSTICO DEL PROBLEMA

El error **"Database error creating new_user"** en el Dashboard indica que hay un problema fundamental con la tabla `auth.users`. Esto suele pasar cuando:

1. **Los triggers de auth.users están fallando**
2. **Hay restricciones de integridad que impiden la inserción**
3. **El schema de auth está corrupto o incompleto**

---

## ✅ SOLUCIÓN 1: Resetear el Schema de Autenticación (Recomendada)

### Paso 1: Ir a SQL Editor y ejecutar:

```sql
-- Verificar si hay restricciones problemáticas
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'users'
AND tc.constraint_type = 'FOREIGN KEY';
```

### Paso 2: Si ves restricciones, eliminarlas temporalmente:

```sql
-- Eliminar constraints problemáticos (guarda los nombres para recrearlos después)
-- Ejemplo: ALTER TABLE users DROP CONSTRAINT nombre_del_constraint;
```

### Paso 3: Crear usuario con mínimos campos:

```sql
-- Desactivar triggers
ALTER TABLE auth.users DISABLE TRIGGER ALL;

-- Insertar usuario mínimo
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'indemnizaciones@correseguros.co',
    crypt('SGS123456', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
);

-- Reactivar triggers
ALTER TABLE auth.users ENABLE TRIGGER ALL;

-- Insertar en public.users
INSERT INTO users (id, email, name, role, initials, is_active)
SELECT id, email, 'Maryory Espinosa Sánchez', 'ADMIN', 'MES', true
FROM auth.users
WHERE email = 'indemnizaciones@correseguros.co';
```

---

## ✅ SOLUCIÓN 2: Crear Proyecto Nuevo (Si la Solución 1 falla)

Si nada funciona, el proyecto de Supabase puede estar corrupto:

### Paso 1: Crear nuevo proyecto

1. Ve a [Supabase Dashboard](https://app.supabase.io)
2. Haz clic en **"New project"**
3. Configura el proyecto (nombre, contraseña de base de datos)
4. Espera a que se cree (2-3 minutos)

### Paso 2: Ejecutar migraciones

1. Ve al SQL Editor del nuevo proyecto
2. Ejecuta: `database/migrations/001_create_user_management.sql`
3. Luego ejecuta: `scripts/create-production-users.sql`

### Paso 3: Actualizar variables de entorno

Actualiza tu archivo `.env.local`:

```env
VITE_SUPABASE_URL=https://nuevo-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=nueva-anon-key
```

---

## ✅ SOLUCIÓN 3: Usar API de Supabase directamente

Crea un archivo `create-user.js`:

```javascript
// create-user.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yxjeuyouhhhptwrllvzh.supabase.co',
  'tu-service-role-key' // Necesitas la service role key (no la anon key)
);

async function createUser() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'indemnizaciones@correseguros.co',
    password: 'SGS123456',
    email_confirm: true,
    user_metadata: {
      name: 'Maryory Espinosa Sánchez',
      role: 'ADMIN',
    },
  });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Usuario creado:', data);
  }
}

createUser();
```

**Para ejecutar:**

```bash
npm install @supabase/supabase-js
node create-user.js
```

**Nota:** Necesitas la **Service Role Key** (no la Anon Key). La encuentras en: Project Settings > API > service_role key.

---

## ✅ SOLUCIÓN 4: Desactivar Triggers y RLS completamente

```sql
-- Desactivar TODOS los triggers del sistema
SET session_replication_role = 'replica';

-- Desactivar RLS en todas las tablas relevantes
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Crear usuario simplificado
INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at, created_at
) VALUES (
    gen_random_uuid(),
    'indemnizaciones@correseguros.co',
    crypt('SGS123456', gen_salt('bf')),
    NOW(),
    NOW()
);

INSERT INTO users (
    id, email, name, role, initials, is_active
) SELECT
    id, email, 'Maryory Espinosa Sánchez', 'ADMIN', 'MES', true
FROM auth.users
WHERE email = 'indemnizaciones@correseguros.co';

-- Reactivar todo
SET session_replication_role = 'origin';
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política permisiva
CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true);
```

---

## 🆘 SI NADA FUNCIONA

Contacta al soporte de Supabase con este mensaje:

```
Subject: Cannot create users - "Database error creating new_user"

Project ID: yxjeuyouhhhptwrllvzh

Description:
I'm unable to create users both through the Dashboard (Authentication > Users > Add user)
and through SQL INSERT statements. The error message is always "Database error creating new_user".

I have tried:
1. Creating user through Dashboard UI
2. Using SQL INSERT into auth.users
3. Disabling triggers and RLS
4. Multiple SQL scripts

None of these methods work. Please help identify the issue with the auth schema.
```

---

## 📊 CHECKLIST RÁPIDO

Antes de intentar cualquier solución, verifica:

- [ ] ¿El proyecto de Supabase está activo? (No en pausa)
- [ ] ¿Tienes permisos de "Owner" o "Administrator"?
- [ ] ¿Hay espacio disponible en el proyecto? (Project Settings > Usage)
- [ ] ¿La base de datos responde a queries simples? (`SELECT 1`)

---

## 🎯 RECOMENDACIÓN FINAL

**Si tienes prisa:** Crea un **proyecto nuevo de Supabase** (Solución 2). Es la forma más rápida y segura.

**Si quieres arreglar el actual:** Prueba la **Solución 4** (desactivar todo completamente).

**¿Quieres que intente algo más específico?** Cuéntame exactamente qué error ves en cada paso.
