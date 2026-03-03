# Sistema de Roles y Permisos - SGS

Este documento describe el sistema de roles y permisos implementado en el Sistema de Gestión de Siniestros (SGS).

## Roles Disponibles

El sistema cuenta con 4 roles principales:

### 1. ADMIN (Administrador)

**Descripción:** Control total del sistema

**Permisos:**

- ✅ Gestión completa de usuarios (crear, editar, desactivar, reactivar)
- ✅ Acceso a todas las vistas y funcionalidades
- ✅ Ingesta de datos masiva (Excel)
- ✅ Visualización de logs de auditoría
- ✅ Dashboard gerencial y reportes estratégicos
- ✅ Asignación de técnicos a siniestros
- ✅ Modificación de cualquier siniestro

**Acceso a Vistas:**

- Dashboard principal
- Dashboard Gerencial
- Listado Maestro
- Ingesta Excel
- Reportes
- Administración de Usuarios
- Logs de Auditoría
- Portal de Aliados (si tiene aliado_id)

---

### 2. GERENTE (Manager)

**Descripción:** Acceso a información estratégica y reportes

**Permisos:**

- ✅ Visualización de todos los siniestros
- ✅ Dashboard gerencial con KPIs y métricas estratégicas
- ✅ Reportes y análisis comparativos
- ✅ Visualización de logs de auditoría (solo lectura)
- ❌ No puede crear/editar usuarios
- ❌ No puede realizar ingestas
- ❌ No puede eliminar datos

**Acceso a Vistas:**

- Dashboard principal
- Dashboard Gerencial
- Listado Maestro
- Reportes
- Logs de Auditoría (solo lectura)

---

### 3. TECNICO (Técnico de Siniestros)

**Descripción:** Gestión operativa de siniestros asignados

**Permisos:**

- ✅ Visualización de siniestros asignados
- ✅ Edición de siniestros asignados
- ✅ Cambio de estados en siniestros asignados
- ✅ Agregar seguimientos y notas
- ❌ No puede ver siniestros de otros técnicos
- ❌ No puede acceder a funciones administrativas
- ❌ No puede ver reportes estratégicos

**Acceso a Vistas:**

- Dashboard principal (con siniestros asignados)
- Listado Maestro (filtrado por asignación)

**Lógica de Asignación:**
Los técnicos solo ven siniestros donde `claims.tecnico_id` coincide con su UUID de usuario.

---

### 4. ALIADO (Aliado/Aseguradora)

**Descripción:** Visualización limitada a siniestros de su organización

**Permisos:**

- ✅ Visualización de siniestros de su organización
- ✅ Búsqueda y filtrado dentro de sus siniestros
- ✅ Exportación de datos (CSV)
- ❌ No puede editar siniestros
- ❌ No puede cambiar estados
- ❌ No puede ver siniestros de otras organizaciones

**Acceso a Vistas:**

- Portal de Aliados (vista especializada)
- Dashboard principal (solo siniestros propios)

**Lógica de Filtrado:**
Los aliados solo ven siniestros donde `claims.aliado_origen` coincide con su `users.aliado_id`.

---

## Matriz de Permisos

| Funcionalidad               | ADMIN | GERENTE | TECNICO        | ALIADO       |
| --------------------------- | ----- | ------- | -------------- | ------------ |
| **Usuarios**                |       |         |                |              |
| Crear usuarios              | ✅    | ❌      | ❌             | ❌           |
| Editar usuarios             | ✅    | ❌      | ❌             | ❌           |
| Desactivar usuarios         | ✅    | ❌      | ❌             | ❌           |
| Ver lista de usuarios       | ✅    | ✅      | ❌             | ❌           |
| **Siniestros**              |       |         |                |              |
| Ver todos los siniestros    | ✅    | ✅      | ❌             | ❌           |
| Ver siniestros asignados    | ✅    | ✅      | ✅             | ❌           |
| Ver siniestros propios      | ✅    | ✅      | ✅             | ✅           |
| Crear siniestros            | ✅    | ❌      | ❌             | ❌           |
| Editar cualquier siniestro  | ✅    | ❌      | ❌             | ❌           |
| Editar siniestros asignados | ✅    | ❌      | ✅             | ❌           |
| Cambiar estado de siniestro | ✅    | ❌      | ✅ (asignados) | ❌           |
| Asignar técnico             | ✅    | ❌      | ❌             | ❌           |
| **Ingesta**                 |       |         |                |              |
| Ingesta masiva (Excel)      | ✅    | ❌      | ❌             | ❌           |
| **Reportes**                |       |         |                |              |
| Dashboard Gerencial         | ✅    | ✅      | ❌             | ❌           |
| Reportes estándar           | ✅    | ✅      | ❌             | ❌           |
| Exportar datos              | ✅    | ✅      | ❌             | ✅ (propios) |
| **Auditoría**               |       |         |                |              |
| Ver logs de auditoría       | ✅    | ✅      | ❌             | ❌           |
| Ver actividad propia        | ✅    | ✅      | ✅             | ✅           |

---

## Implementación Técnica

### Control de Acceso en Frontend

#### 1. Componente RoleBasedRoute

```tsx
// Protección de rutas completas
<RoleBasedRoute allowedRoles={['ADMIN', 'GERENTE']}>
  <ManagerDashboard />
</RoleBasedRoute>
```

#### 2. HOC withRole

```tsx
// Protección de componentes individuales
const ProtectedComponent = withRole(MyComponent, {
  allowedRoles: ['ADMIN'],
});
```

#### 3. Utilidades de Permisos (roleUtils.ts)

```tsx
// Verificación programática
if (canManageUsers(currentUser.role)) {
  // Mostrar opción de administración
}

if (canEditClaim(currentUser.role, claim.tecnico_id, currentUser.id)) {
  // Permitir edición
}
```

### Control de Acceso en Backend (RLS)

Las políticas de Row Level Security (RLS) en Supabase garantizan que:

1. **Usuarios** pueden ver/editar solo su propio perfil
2. **ADMIN** puede gestionar todos los usuarios
3. **GERENTE** puede ver todos los usuarios (solo lectura)
4. **Técnicos** solo ven siniestros donde `tecnico_id` coincide
5. **Aliados** solo ven siniestros donde `aliado_origen` coincide

---

## Gestión de Usuarios

### Creación de Usuarios

Solo los usuarios con rol **ADMIN** pueden crear nuevos usuarios. El proceso incluye:

1. Crear usuario en `auth.users` (Supabase Auth)
2. Crear registro en `public.users` (metadatos)
3. Asignar rol y permisos
4. Enviar credenciales al usuario

### Estados de Usuario

- **Activo:** Usuario puede iniciar sesión y utilizar el sistema
- **Inactivo:** Usuario no puede iniciar sesión (soft delete)

### Roles y Aliados

Los usuarios con rol **ALIADO** deben tener asignado un `aliado_id` que coincida con el campo `aliado_origen` en los siniestros.

---

## Auditoría

Todas las acciones críticas se registran en `audit_logs`:

- Login/logout
- Creación/edición/eliminación de usuarios
- Cambios en siniestros
- Ingesta de datos
- Cambios de estado

Los **ADMIN** y **GERENTE** pueden ver todos los logs. Los demás usuarios solo ven sus propias acciones.

---

## Mejores Prácticas

1. **Principio de Mínimo Privilegio:** Asignar el rol más restrictivo necesario
2. **Separación de Responsabilidades:** No asignar múltiples roles al mismo usuario
3. **Revisión Periódica:** Auditar permisos de usuarios trimestralmente
4. **Documentación:** Mantener registro de cambios en roles

---

## Solución de Problemas

### Usuario no puede iniciar sesión

- Verificar que el usuario esté activo (`is_active = true`)
- Verificar credenciales en Supabase Auth
- Revisar logs de auditoría por intentos fallidos

### Usuario no ve siniestros esperados

- Verificar rol del usuario
- Para TECNICO: verificar `tecnico_id` en siniestros
- Para ALIADO: verificar `aliado_id` del usuario y `aliado_origen` en siniestros

### Acceso denegado a funcionalidad

- Verificar rol requerido vs rol del usuario
- Revisar implementación de `allowedRoles` en componente
- Verificar políticas RLS en base de datos

---

## Contacto

Para solicitudes de cambio de rol o permisos especiales, contactar al administrador del sistema.
