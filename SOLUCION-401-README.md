# 🔧 SOLUCIÓN ERROR 401 - SGS NO CARGA DATOS

## ❌ Problema

La aplicación muestra errores 401 al intentar cargar datos de Supabase.

## 🔍 Causa

El login usa **MOCK_USERS** (autenticación local), pero Supabase requiere autenticación real o políticas RLS que permitan el acceso.

## ✅ SOLUCIÓN RÁPIDA (2 minutos)

### Paso 1: Desactivar RLS en Supabase

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **"SQL Editor"** (icono de terminal en el menú lateral)
4. Crea un **"New query"**
5. Pega el contenido del archivo: **`supabase_disable_rls.sql`**
6. Click en **"Run"**

Esto desactivará las restricciones de seguridad temporalmente.

### Paso 2: Insertar datos de prueba

Opción A - Ejecutar script:

```bash
npx ts-node seed-supabase.ts
```

Opción B - Manual en SQL Editor:

```sql
-- Insertar un claim de prueba
INSERT INTO claims (id_softseguros, numero_siniestro, poliza, asegurado, aseguradora, ramo, estado_interno, estado_softseguros, monto_reclamo, valor_deducible, valor_indemnizacion)
VALUES ('TEST-001', 'SIN-TEST-001', 'POL-TEST', 'Usuario Prueba', 'Allianz', 'Autos', 'RADICACIÓN COMPAÑÍA', 'ABIERTO', 1000000, 100000, 900000);
```

### Paso 3: Recargar la aplicación

1. Presiona **F5** en el navegador
2. Inicia sesión con:
   - **Admin:** admin@softseguros.com / 123456
   - **Técnico:** tecnico@softseguros.com / 123456
3. ¡Los datos deberían cargar ahora!

---

## 🔒 SOLUCIÓN PARA PRODUCCIÓN (Recomendada)

Si vas a usar esto en producción real:

### Opción 1: Integrar Supabase Auth

1. Ve a Authentication → Providers → Email
2. Habilita "Enable Email Provider"
3. Crea usuarios manualmente con metadata:
   ```json
   {
     "role": "ADMIN",
     "name": "Administrador"
   }
   ```
4. Modifica `Login.tsx` para usar Supabase Auth en lugar de MOCK_USERS

### Opción 2: Mantener RLS desactivado (solo si es intranet)

Si la app está en una red interna segura, puedes mantener RLS desactivado.

---

## 📋 CHECKLIST

- [ ] Ejecutar SQL: `supabase_disable_rls.sql` en Supabase
- [ ] Insertar datos de prueba (ejecutar `seed-supabase.ts`)
- [ ] Recargar navegador (F5)
- [ ] Verificar que no hay errores 401 en consola
- [ ] Confirmar que los KPIs muestran datos (no 0)

---

## 🐛 Si sigue sin funcionar

1. **Verifica la consola del navegador (F12):**
   - ¿Sigue apareciendo "401 Unauthorized"?
   - ¿Hay errores de CORS?

2. **Verifica las variables de entorno:**

   ```bash
   # En tu .env local:
   VITE_SUPABASE_URL=https://yxjeuyouhhhptwrllvzh.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_clave_aqui
   ```

3. **Verifica que las tablas existen:**
   - Ve a Supabase → Table Editor
   - Confirma que existen: `claims`, `state_history`, `timeline`, `amparos`

4. **Contacta soporte:**
   Si nada funciona, el problema puede ser con la API Key o el proyecto de Supabase.

---

## 📁 Archivos importantes

- `supabase_disable_rls.sql` - Desactiva restricciones de seguridad
- `seed-supabase.ts` - Inserta datos de prueba
- `supabase_rls_policies.sql` - Configuración segura para producción (más tarde)
