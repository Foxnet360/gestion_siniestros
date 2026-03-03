## Why

El sistema actual utiliza MOCK_USERS hardcodeados con autenticación mock (contraseña fija '123456'). Esto impide la gestión real de usuarios, la asignación dinámica de técnicos a siniestros, y el control de acceso basado en roles. Se requiere un sistema completo de gestión de usuarios para soportar 10-50 usuarios con diferentes roles (ADMIN, GERENTE, TÉCNICO, ALIADO), incluyendo un portal específico para aliados, dashboard de análisis estratégico para gerencia, y auditoría de todas las acciones realizadas.

## What Changes

- **Reemplazar MOCK_USERS** por tabla real `users` en Supabase con autenticación segura
- **Crear Panel de Administración de Usuarios** con funcionalidades CRUD (Crear, Leer, Actualizar, Desactivar)
- **Implementar Portal de Aliados** con vista restringida y acceso a sus siniestros asignados
- **Desarrollar Sistema de Auditoría** que registre todas las acciones críticas realizadas por usuarios
- **Actualizar Login** para usar autenticación real con email/password y Supabase Auth
- **Modificar ClaimsContext** para integrar autenticación real y gestión de sesiones
- **Añadir control de permisos** en rutas y componentes basado en roles de usuario (ADMIN, GERENTE, TÉCNICO, ALIADO)
- **Crear Dashboard de Gerencia** con análisis estratégico, KPIs avanzados y reportes comparativos
- **Migrar campo `tecnico_asignado`** de string a relación con tabla users
- **Implementar gestión de estado de usuarios** (activo/inactivo) en lugar de eliminación física

## Capabilities

### New Capabilities

- `user-authentication`: Sistema de login/logout usando Supabase Auth con email/password, gestión de sesiones y tokens JWT
- `user-admin-crud`: Panel de administración completo para gestionar usuarios (crear, editar, desactivar), asignar roles y gestionar permisos
- `ally-portal`: Portal especializado para usuarios con rol ALIADO con acceso restringido solo a siniestros de su organización
- `audit-trail`: Sistema de auditoría que registra todas las acciones críticas (cambios de estado, modificaciones de siniestros, ingestas) con timestamp y usuario responsable
- `user-profile`: Gestión de perfiles de usuario para que cada uno pueda actualizar sus datos personales y cambiar contraseña
- `role-based-access`: Control de acceso basado en roles que restringe funcionalidades según el rol del usuario (ADMIN acceso total, GERENTE dashboard estratégico, TÉCNICO casos asignados, ALIADO vista limitada)
- `manager-dashboard`: Dashboard exclusivo para rol GERENTE con análisis estratégico avanzado: métricas de rentabilidad por aseguradora, tendencias de siniestralidad, análisis de tiempos de resolución, proyecciones financieras y comparativos históricos

### Modified Capabilities

- `aliado-rls`: Actualizar políticas RLS existentes para integrar autenticación real de usuarios ALIADO

## Impact

**Base de Datos:**

- Nueva tabla `users` con campos: id, email, name, role (ADMIN, GERENTE, TECNICO, ALIADO), initials, aliado_id, is_active, created_at, updated_at
- Nueva tabla `audit_logs` para registro de acciones: id, user_id, action, entity_type, entity_id, details, created_at
- Modificación tabla `claims`: cambiar `tecnico_asignado` (string) a `tecnico_id` (UUID foreign key a users)
- Índices en users.email (único), users.role, audit_logs.user_id, audit_logs.created_at

**Backend/Servicios:**

- Integración completa con Supabase Auth
- Nuevas políticas RLS en tablas sensibles basadas en autenticación
- Migración de datos: convertir técnicos actuales (string) a registros en tabla users

**Frontend - Componentes:**

- Refactorización completa de `Login.tsx` para autenticación real
- Nuevo componente `UserAdmin.tsx` (panel de administración)
- Nuevo componente `UserForm.tsx` (formulario crear/editar usuario)
- Nuevo componente `UserProfile.tsx` (perfil propio)
- Nuevo componente `AuditLog.tsx` (visualización de auditoría)
- Nuevo componente `ManagerDashboard.tsx` (dashboard estratégico exclusivo para GERENTE)
- Nuevos componentes de reportes estratégicos: `ProfitabilityAnalysis.tsx`, `TrendAnalysis.tsx`, `ForecastingChart.tsx`
- Modificación `Sidebar.tsx` para mostrar usuario autenticado real
- Actualización `ClaimsContext.tsx` para manejar sesión real
- Nuevos hooks: `useAuth.ts`, `useUsers.ts`, `useAudit.ts`

**Frontend - Rutas/Permisos:**

- Protección de rutas según rol de usuario
- Redirección automática de ALIADOS a su portal
- Redirección automática de GERENTES a su dashboard estratégico
- Ocultar opciones de menú según permisos

**Seguridad:**

- Todas las contraseñas hasheadas por Supabase Auth
- Tokens JWT con expiración
- Políticas RLS en todas las tablas sensibles
- Validación de permisos en frontend y backend

**Migración:**

- Script para crear usuarios a partir de técnicos existentes en campo `tecnico_asignado`
- Script para migrar ALIADOS existentes a estructura nueva

**Dependencias:**

- @supabase/supabase-js (ya instalado)
- Supabase Auth (configuración en dashboard)
- Posiblemente: react-hook-form para formularios (evaluar)

**Testing:**

- Crear usuarios de prueba para cada rol
- Validar permisos en todas las vistas
- Probar flujo completo: login → acciones → logout
