## Context

El sistema SGS tiene implementado el schema de user management con tablas `users` y `auth.users` en Supabase. Se requiere crear 13 usuarios de producción para el equipo actual de trabajo. Los usuarios ya están definidos con sus emails y roles asignados.

El sistema actual usa Supabase Auth con funciones RPC (`create_user_with_auth`) que manejan la creación simultánea en ambas tablas (`auth.users` y `public.users`).

## Goals / Non-Goals

**Goals:**

- Crear 13 usuarios de producción con roles específicos (ADMIN, TECNICO, GERENTE)
- Asignar contraseña inicial estándar "SGS123456" a todos los usuarios
- Generar iniciales automáticamente desde los nombres
- Crear script SQL reproducible y auditable
- Asegurar que los usuarios puedan iniciar sesión inmediatamente

**Non-Goals:**

- No incluir lógica de negocio adicional
- No modificar permisos o roles existentes
- No implementar flujo de cambio de contraseña obligatorio (ya existe en el sistema)
- No crear aliados (todos son usuarios internos)

## Decisions

### 1. Usar función RPC existente `create_user_with_auth`

**Rationale:** La función ya existe y maneja correctamente la creación en ambas tablas (auth.users y public.users), generación de UUIDs, encriptación de contraseñas y triggers de auditoría.

**Alternativa considerada:** Insertar directamente en las tablas - Rechazado porque requería duplicar lógica de encriptación y manejo de triggers.

### 2. Script SQL puro (no TypeScript)

**Rationale:** Es más directo, rápido de ejecutar en Supabase SQL Editor, y no requiere dependencias adicionales. También es más fácil de revisar y auditar.

**Alternativa considerada:** Script TypeScript con Supabase client - Rechazado por complejidad innecesaria para una tarea puntual de creación de usuarios.

### 3. Contraseña inicial hardcodeada

**Rationale:** Todos los usuarios usarán la misma contraseña inicial "SGS123456" que deberán cambiar en su primer login. Esto simplifica el despliegue inicial.

**Alternativa considerada:** Generar contraseñas aleatorias - Rechazado porque complicaba la comunicación a los usuarios y el sistema ya requiere cambio de contraseña en primer login.

### 4. Iniciales automáticas

**Rationale:** Las iniciales se generan tomando la primera letra del primer nombre + primera letra del primer apellido (ej: "Maryory Espinosa" → "ME").

**Alternativa considerada:** Solicitar iniciales manualmente - Rechazado porque los nombres ya están definidos y las iniciales pueden derivarse consistentemente.

## Risks / Trade-offs

**Riesgo:** Usuarios no cambian la contraseña inicial → Mitigación: El sistema ya tiene flujo de "cambio de contraseña" recomendado en primer login. Los administradores pueden forzar reset desde UserAdmin.

**Riesgo:** Emails incorrectos → Mitigación: Verificar lista antes de ejecutar. Si un email falla, el usuario específico puede recrearse individualmente.

**Riesgo:** Roles incorrectos asignados → Mitigación: Los roles pueden modificarse desde el panel de administración después de la creación.

## Migration Plan

1. Verificar que el schema de user management esté aplicado en producción
2. Ejecutar script SQL en Supabase SQL Editor
3. Verificar creación exitosa consultando tabla `users`
4. Notificar a cada usuario sus credenciales (email + contraseña inicial)
5. Solicitar cambio de contraseña en primer login

**Rollback:**

```sql
-- Desactivar usuarios si es necesario
UPDATE users SET is_active = false
WHERE email IN ('indemnizaciones@correseguros.co', 'info@correseguros.co', ...);
```
