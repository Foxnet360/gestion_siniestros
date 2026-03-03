# Creación de Usuarios de Producción

Este script crea los 13 usuarios iniciales para el sistema SGS en producción.

## 📋 Lista de Usuarios

### ADMIN (2 usuarios)

1. **Maryory Espinosa Sánchez** - indemnizaciones@correseguros.co
2. **Alejandro Cardona** - info@correseguros.co

### TECNICO (4 usuarios)

3. **Sara Lucía Bedoya Velásquez** - indemnizaciones1@correseguros.co
4. **Sandra Echeverri** - tecnico.vida@correseguros.co
5. **Gonzalo Duque Restrepo** - tecnico.jfaseguros@correseguros.co
6. **Yobani Gomez** - asistente.jfaseguros@correseguros.co

### GERENTE (7 usuarios)

7. **Luz Elena** - elenacorreseguros@gmail.com
8. **Manuel Antonio Velasquez León** - gerencia.comercial@correseguros.co
9. **Carlos Enrique Vallejo** - carlosvallejo@seacompetitivo.com
10. **Claudia Arbelaez** - procesosyproyectos@correseguros.co
11. **Luis alberto Gallón** - director2jfaseguros@correseguros.co
12. **Alejandro Uribe Velez** - auribe@uvseguros.com.co
13. **Lisimaco cifuentes** - lisimacocorreseguros@gmail.com

## 🔑 Contraseña Inicial

**Contraseña para todos los usuarios:** `SGS123456`

⚠️ **IMPORTANTE:** Los usuarios deben cambiar su contraseña en el primer inicio de sesión.

## 🚀 Instrucciones de Ejecución

### 1. Pre-requisitos

- Tener acceso al SQL Editor de Supabase
- Verificar que el schema de user management esté aplicado
- Confirmar que la función `create_user_with_auth` existe

### 2. Ejecutar el Script

1. Abre el [SQL Editor de Supabase](https://app.supabase.io)
2. Selecciona tu proyecto
3. Ve a la sección "SQL Editor"
4. Crea una "New query"
5. Copia y pega el contenido de `scripts/create-production-users.sql`
6. Haz clic en "Run"

### 3. Verificación

Después de ejecutar, verifica que los usuarios se crearon correctamente:

```sql
-- Verificar total de usuarios
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Verificar usuarios específicos
SELECT name, email, role, initials FROM users ORDER BY role, name;
```

Deberías ver:

- 2 usuarios con rol 'ADMIN'
- 4 usuarios con rol 'TECNICO'
- 7 usuarios con rol 'GERENTE'
- Total: 13 usuarios

### 4. Notificación a Usuarios

Envía un correo a cada usuario con la siguiente información:

```
Asunto: Acceso al Sistema SGS - Credenciales Iniciales

Hola [Nombre],

Se ha creado tu cuenta en el Sistema de Gestión de Siniestros (SGS).

Tus credenciales de acceso:
- Email: [email]
- Contraseña temporal: SGS123456

🔗 URL de acceso: [URL del sistema]

⚠️ Por seguridad, debes cambiar tu contraseña en tu primer inicio de sesión.

Saludos,
Equipo de Sistemas
```

## 🔄 Rollback (Si es necesario)

Si necesitas desactivar todos los usuarios creados:

```sql
-- Desactivar usuarios específicos
UPDATE users
SET is_active = false
WHERE email IN (
    'indemnizaciones@correseguros.co',
    'info@correseguros.co',
    'indemnizaciones1@correseguros.co',
    'tecnico.vida@correseguros.co',
    'tecnico.jfaseguros@correseguros.co',
    'asistente.jfaseguros@correseguros.co',
    'elenacorreseguros@gmail.com',
    'gerencia.comercial@correseguros.co',
    'carlosvallejo@seacompetitivo.com',
    'procesosyproyectos@correseguros.co',
    'director2jfaseguros@correseguros.co',
    'auribe@uvseguros.com.co',
    'lisimacocorreseguros@gmail.com'
);
```

Para reactivar:

```sql
UPDATE users
SET is_active = true
WHERE email IN (...mismos emails...);
```

## ✨ Características del Script

- ✅ **Idempotente**: Puede ejecutarse múltiples veces sin crear duplicados
- ✅ **Verificación automática**: Verifica si el usuario ya existe antes de crearlo
- ✅ **Iniciales automáticas**: Calcula las iniciales desde el nombre completo
- ✅ **Mensajes informativos**: Muestra el progreso de la creación
- ✅ **Resumen final**: Muestra estadísticas al finalizar

## 🐛 Solución de Problemas

### Error: "function create_user_with_auth does not exist"

**Solución:** Ejecutar primero el script de migración `database/migrations/001_create_user_management.sql`

### Error: "duplicate key value violates unique constraint"

**Solución:** El script ya es idempotente, pero si ves este error, verifica que no haya usuarios manuales creados con los mismos emails.

### Usuario no puede iniciar sesión

**Verificar:**

1. Que el usuario esté activo: `SELECT is_active FROM users WHERE email = '...'`
2. Que la contraseña sea exactamente: `SGS123456`
3. Que el email esté escrito correctamente (distingue mayúsculas/minúsculas)

## 📞 Soporte

Para problemas con la creación de usuarios, contactar al administrador del sistema.
