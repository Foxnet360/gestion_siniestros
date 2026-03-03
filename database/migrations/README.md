# 🔧 Esquema de Base de Datos SGS - Sincronización Completa

## 📁 Archivos Generados

1. **`002_complete_schema_sync.sql`** - Esquema completo de base de datos
2. **`003_create_all_users.sql`** - Script para crear los 13 usuarios de producción

## 🚀 Instrucciones de Instalación

### Paso 1: Ejecutar Esquema Base

1. Abre **Supabase Dashboard**
2. Ve a **SQL Editor**
3. Crea una **"New query"**
4. Copia y pega el contenido de: `database/migrations/002_complete_schema_sync.sql`
5. Ejecuta (**Run**)

**Resultado esperado:**

- Tablas `users` y `audit_logs` creadas
- Funciones `create_user_with_auth` y `log_audit_action` creadas
- Políticas RLS configuradas (permissivas para desarrollo)
- Índices creados

### Paso 2: Crear Usuarios

1. En el mismo SQL Editor, crea otra **"New query"**
2. Copia y pega el contenido de: `database/migrations/003_create_all_users.sql`
3. Ejecuta (**Run**)

**Resultado esperado:**

```
Usuario 1/13: Maryory Espinosa Sánchez (ADMIN)
Usuario 2/13: Alejandro Cardona (ADMIN)
...
Usuario 13/13: Lisimaco Cifuentes (GERENTE)

Total usuarios: 13
```

### Paso 3: Verificar en Dashboard

1. Ve a **Authentication > Users**
2. Debes ver los 13 emails listados
3. Ve a **Table Editor > users**
4. Debes ver los 13 registros con sus roles

## ✅ Login de Prueba

Una vez ejecutados los scripts:

**Email:** `indemnizaciones@correseguros.co`  
**Contraseña:** `SGS123456`  
**Rol:** ADMIN

## 📊 Usuarios Creados

| #   | Nombre                        | Email                                | Rol     |
| --- | ----------------------------- | ------------------------------------ | ------- |
| 1   | Maryory Espinosa Sánchez      | indemnizaciones@correseguros.co      | ADMIN   |
| 2   | Alejandro Cardona             | info@correseguros.co                 | ADMIN   |
| 3   | Sara Lucía Bedoya Velásquez   | indemnizaciones1@correseguros.co     | TECNICO |
| 4   | Sandra Echeverri              | tecnico.vida@correseguros.co         | TECNICO |
| 5   | Gonzalo Duque Restrepo        | tecnico.jfaseguros@correseguros.co   | TECNICO |
| 6   | Yobani Gomez                  | asistente.jfaseguros@correseguros.co | TECNICO |
| 7   | Luz Elena                     | elenacorreseguros@gmail.com          | GERENTE |
| 8   | Manuel Antonio Velasquez León | gerencia.comercial@correseguros.co   | GERENTE |
| 9   | Carlos Enrique Vallejo        | carlosvallejo@seacompetitivo.com     | GERENTE |
| 10  | Claudia Arbelaez              | procesosyproyectos@correseguros.co   | GERENTE |
| 11  | Luis Alberto Gallón           | director2jfaseguros@correseguros.co  | GERENTE |
| 12  | Alejandro Uribe Velez         | auribe@uvseguros.com.co              | GERENTE |
| 13  | Lisimaco Cifuentes            | lisimacocorreseguros@gmail.com       | GERENTE |

## 🔧 Características del Esquema

### Tablas Creadas:

- **users** - Perfiles de usuarios con roles
- **audit_logs** - Registro de auditoría
- **claims** - Ya existente, se agrega `tecnico_id`

### Funciones:

- **create_user_with_auth()** - Crear usuario en auth.users y public.users
- **log_audit_action()** - Registrar acciones de auditoría
- **update_updated_at_column()** - Trigger para updated_at automático

### Seguridad:

- **RLS** - Row Level Security activado en todas las tablas
- **Políticas permissivas** - Para desarrollo (cambiar en producción)

## ⚠️ Notas Importantes

1. **Políticas RLS:** Las políticas actuales permiten todo (`USING (true)`). Para producción, ajústalas según necesites.

2. **Contraseñas:** Todas las contraseñas iniciales son `SGS123456`. Los usuarios deben cambiarlas.

3. **UUIDs fijos:** Los usuarios tienen UUIDs predefinidos para evitar duplicados si ejecutas el script varias veces.

4. **ON CONFLICT:** El script usa `ON CONFLICT DO NOTHING` para ser idempotente (puedes ejecutarlo varias veces sin errores).

## 🆘 Solución de Problemas

### Error: "relation 'users' already exists"

**Solución:** El script usa `DROP TABLE IF EXISTS`, así que recreará las tablas. Asegúrate de no tener datos importantes.

### Error: "permission denied"

**Solución:** El script desactiva temporalmente RLS. Si persiste, ejecuta:

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### Error: "function does not exist"

**Solución:** Asegúrate de haber ejecutado primero `002_complete_schema_sync.sql`

### Los usuarios no aparecen en Authentication > Users

**Solución:** Verifica que la inserción en `auth.users` funcionó:

```sql
SELECT email FROM auth.users WHERE email LIKE '%correseguros%';
```

## 📞 Soporte

Si tienes problemas, ejecuta este diagnóstico en SQL Editor:

```sql
-- Verificar estado completo
SELECT 'Tabla users:' as item, COUNT(*) as count FROM users
UNION ALL
SELECT 'Tabla auth.users:', COUNT(*) FROM auth.users
UNION ALL
SELECT 'Función create_user_with_auth:',
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_user_with_auth')
       THEN 1 ELSE 0 END;
```

**¿Todo listo?** Refresca tu app (F5) e intenta login con `indemnizaciones@correseguros.co` / `SGS123456`
