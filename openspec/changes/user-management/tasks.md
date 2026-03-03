## 1. Preparación Base de Datos

- [x] 1.1 Crear tabla `users` en Supabase con campos: id (UUID), email (unique), name, role (enum), initials, aliado_id, is_active, created_at, updated_at
- [x] 1.2 Crear tabla `audit_logs` con campos: id (UUID), user_id (FK), action, entity_type, entity_id, details (JSON), created_at
- [x] 1.3 Modificar tabla `claims`: agregar columna `tecnico_id` (UUID, FK a users), mantener tecnico_asignado temporalmente
- [x] 1.4 Crear índice en `users(email)` - único
- [x] 1.5 Crear índice en `users(role)`
- [x] 1.6 Crear índice en `audit_logs(user_id, created_at)`
- [x] 1.7 Crear índice en `claims(tecnico_id, estado_interno)`
- [x] 1.8 Crear índice en `claims(created_at, estado_interno)`
- [x] 1.9 Crear índice en `claims(aseguradora, fecha_ocurrencia)`
- [x] 1.10 Crear políticas RLS en tabla `claims` para ADMIN, GERENTE, TECNICO y ALIADO

## 2. Configuración Supabase Auth

- [ ] 2.1 Habilitar Email/Password Auth en dashboard de Supabase
- [ ] 2.2 Configurar duración de sesión JWT (ej: 24 horas)
- [ ] 2.3 Configurar política de refresh tokens
- [ ] 2.4 Configurar redirecciones post-confirmación de email
- [ ] 2.5 Deshabilitar confirmación de email (auto-confirm) para simplificar flujo
- [ ] 2.6 Configurar constraints de contraseña (mínimo 8 caracteres)

## 3. Políticas RLS (Row Level Security)

- [x] 3.1 Habilitar RLS en tabla `users`
- [x] 3.2 Crear política RLS: usuarios pueden ver/editar su propio perfil
- [x] 3.3 Crear política RLS: ADMIN puede ver/crear/editar todos los usuarios
- [x] 3.4 Crear política RLS: GERENTE puede ver todos los usuarios (solo lectura)
- [x] 3.5 Habilitar RLS en tabla `audit_logs`
- [x] 3.6 Crear política RLS: ADMIN y GERENTE pueden ver audit_logs
- [x] 3.7 Crear política RLS: usuarios pueden ver sus propias acciones en audit_logs
- [x] 3.8 Actualizar políticas RLS en tabla `claims` para usar tecnico_id en lugar de string
- [x] 3.9 Actualizar políticas RLS para ALIADO: ver solo siniestros de su organización

## 4. Scripts de Migración

- [x] 4.1 Desarrollar script para extraer lista única de técnicos de claims.tecnico_asignado
- [x] 4.2 Desarrollar script para crear usuarios en auth.users (Supabase) para cada técnico único
- [x] 4.3 Desarrollar script para crear registros correspondientes en tabla public.users con role=TECNICO
- [x] 4.4 Desarrollar script para actualizar claims.tecnico_id con UUID del usuario creado
- [ ] 4.5 Desarrollar script de rollback que restaure claims.tecnico_asignado desde backup
- [ ] 4.6 Probar script de migración en ambiente de desarrollo
- [ ] 4.7 Validar integridad de datos post-migración (todos los claims tienen tecnico_id válido)

## 5. Context y Providers

- [x] 5.1 Crear `context/AuthContext.tsx` con métodos: login, logout, refreshSession, resetPassword
- [x] 5.2 Crear hook `hooks/useAuth.ts` para acceder a AuthContext
- [x] 5.3 Integrar AuthProvider en App.tsx (envolver ClaimsProvider)
- [x] 5.4 Modificar `context/ClaimsContext.tsx` para usar usuario autenticado de AuthContext en lugar de MOCK_USERS
- [x] 5.5 Actualizar tipos en `types.ts`: agregar campo `tecnico_id` a Claim interface
- [x] 5.6 Crear hook `hooks/useCurrentUser.ts` para obtener usuario actual con metadatos completos

## 6. Componente de Autenticación

- [x] 6.1 Refactorizar `components/Login.tsx` para usar Supabase Auth en lugar de MOCK_USERS
- [x] 6.2 Implementar manejo de errores: credenciales inválidas, cuenta desactivada, sesión expirada
- [x] 6.3 Implementar redirección automática según rol después de login exitoso (en AuthContext)
- [x] 6.4 Agregar loading states durante autenticación
- [ ] 6.5 Implementar "Recordarme" opción (persistir sesión en localStorage vs sessionStorage)
- [x] 6.6 Agregar validación de formulario (email válido, contraseña no vacía)

## 7. Panel de Administración de Usuarios

- [x] 7.1 Crear componente `components/UserAdmin.tsx` - lista de usuarios con filtros y paginación
- [x] 7.2 Crear componente `components/UserForm.tsx` - formulario crear/editar usuario
- [x] 7.3 Implementar validación de campos: email único, role requerido, name requerido
- [x] 7.4 Implementar creación de usuario: crear en auth.users y public.users simultáneamente
- [x] 7.5 Implementar edición de usuario: actualizar metadatos (no email si ya existe)
- [x] 7.6 Implementar desactivación de usuario (soft delete): is_active = false
- [x] 7.7 Implementar reactivación de usuario desactivado
- [ ] 7.8 Implementar cambio de contraseña por administrador
- [x] 7.9 Agregar búsqueda y filtros en lista de usuarios (por nombre, email, rol)
- [x] 7.10 Agregar paginación server-side para lista de usuarios

## 8. Perfil de Usuario

- [x] 8.1 Crear componente `components/UserProfile.tsx` - ver y editar datos propios
- [x] 8.2 Implementar cambio de contraseña propia (requiere contraseña actual)
- [x] 8.3 Implementar edición de datos personales: nombre, iniciales
- [x] 8.4 Implementar validación: no puede cambiar email ni rol
- [x] 8.5 Agregar sección de "Actividad reciente" mostrando últimas acciones del usuario

## 9. Control de Acceso por Roles

- [x] 9.1 Crear componente `components/RoleBasedRoute.tsx` - proteger rutas según rol
- [x] 9.2 Crear HOC `components/withRole.tsx` - envolver componentes con verificación de rol
- [x] 9.3 Implementar redirección automática si usuario accede a ruta no autorizada
- [x] 9.4 Actualizar `components/Sidebar.tsx` para mostrar/ocultar opciones según rol
- [x] 9.5 Ocultar opción "Administración de Usuarios" para no-ADMIN
- [x] 9.6 Ocultar opción "Auditoría" para TECNICO y ALIADO
- [x] 9.7 Mostrar opción "Dashboard Gerencial" solo para GERENTE
- [x] 9.8 Mostrar opción "Portal Aliado" solo para ALIADO
- [x] 9.9 Implementar verificación de permisos en acciones (ej: solo ADMIN puede eliminar)

## 10. Portal de Aliados

- [x] 10.1 Crear componente `components/AllyPortal.tsx` - vista especializada para ALIADO
- [x] 10.2 Implementar filtrado automático: mostrar solo siniestros donde aliado_origen = aliado del usuario
- [x] 10.3 Implementar paginación server-side obligatoria (aliados pueden tener muchos siniestros)
- [x] 10.4 Ocultar funcionalidades de edición (aliados solo ven información, no modifican)
- [x] 10.5 Mostrar resumen estadístico: total de siniestros, por estado, montos
- [x] 10.6 Implementar búsqueda de siniestros propios por número, asegurado, póliza
- [ ] 10.7 Agregar opción de descargar reporte PDF de sus siniestros

## 11. Sistema de Auditoría

- [x] 11.1 Crear servicio `services/auditService.ts` con función `logAction()`
- [x] 11.2 Implementar registro automático de login exitoso en audit_logs
- [x] 11.3 Implementar registro automático de login fallido en audit_logs
- [x] 11.4 Implementar registro automático de logout en audit_logs
- [x] 11.5 Implementar registro de cambios de estado en siniestros en audit_logs
- [x] 11.6 Implementar registro de modificaciones de siniestros en audit_logs
- [ ] 11.7 Implementar registro de ingestas de Excel en audit_logs
- [x] 11.8 Implementar registro de creación/edición/eliminación de usuarios en audit_logs
- [x] 11.9 Crear componente `components/AuditLog.tsx` - visualización de logs con filtros
- [x] 11.10 Implementar filtros en AuditLog: por usuario, acción, fecha, entidad
- [x] 11.11 Implementar paginación server-side para audit_logs (pueden crecer mucho)
- [x] 11.12 Agregar exportación a CSV de logs filtrados

## 12. Dashboard de Gerencia (Manager Dashboard)

- [x] 12.1 Crear componente `components/ManagerDashboard.tsx` - layout principal
- [x] 12.2 Crear componente `components/manager/ProfitabilityAnalysis.tsx` - rentabilidad por aseguradora
- [x] 12.3 Calcular métricas: total reclamado vs indemnizado por aseguradora
- [x] 12.4 Crear componente `components/manager/TrendAnalysis.tsx` - tendencias de siniestralidad
- [x] 12.5 Calcular tendencias: casos por mes, comparativo año vs año
- [x] 12.6 Crear componente `components/manager/ForecastingChart.tsx` - proyecciones financieras
- [x] 12.7 Calcular proyecciones basadas en datos históricos (tendencia lineal simple)
- [x] 12.8 Crear componente `components/manager/ResolutionTimeAnalysis.tsx` - tiempos de resolución
- [x] 12.9 Calcular métricas: tiempo promedio por fase, por aseguradora, por técnico
- [x] 12.10 Crear componente `components/manager/ComparativeAnalysis.tsx` - comparativos históricos
- [ ] 12.11 Implementar filtros de fecha en dashboard (último mes, trimestre, año, personalizado)
- [ ] 12.12 Implementar filtros por aseguradora, ramo, técnico
- [ ] 12.13 Agregar exportación a PDF del dashboard completo
- [x] 12.14 Optimizar queries con índices ya creados

## 13. Servicios y Hooks

- [x] 13.1 Crear servicio `services/userService.ts` con funciones: createUser, updateUser, deleteUser, getUsers, getUserById
- [x] 13.2 Crear hook `hooks/useUsers.ts` para gestionar lista de usuarios
- [x] 13.3 Crear servicio `services/auditService.ts` con funciones: logAction, getAuditLogs, getUserActivity
- [x] 13.4 Crear hook `hooks/useAudit.ts` para acceder a logs de auditoría
- [x] 13.5 Crear servicio `services/managerDashboardService.ts` con funciones para métricas estratégicas
- [x] 13.6 Crear hook `hooks/useManagerDashboard.ts` para datos del dashboard gerencial
- [x] 13.7 Actualizar ClaimsContext para usar tecnico_id en lugar de tecnico_asignado
- [x] 13.8 Crear función helper `utils/roleUtils.ts` para verificar permisos
- [x] 13.9 Crear hook `hooks/useCurrentUser.ts` para obtener usuario actual con metadatos completos
- [x] 13.10 Crear HOC `components/withRole.tsx` para proteger componentes por rol

## 14. Actualización de Componentes Existentes

- [x] 14.1 Actualizar `components/ClaimsTable.tsx` para usar tecnico_id y mostrar nombre del técnico
- [x] 14.2 Actualizar `components/ClaimDetail.tsx` para permitir asignar técnico desde dropdown de usuarios reales
- [x] 14.3 Actualizar `components/Dashboard.tsx` para mostrar información del usuario autenticado
- [x] 14.4 Actualizar `components/Sidebar.tsx` para mostrar avatar/iniciales del usuario real
- [x] 14.5 Actualizar `components/EditTrackingTab.tsx` para registrar auditoría al guardar seguimiento
- [x] 14.6 Actualizar `components/Ingest.tsx` para registrar auditoría al realizar ingesta
- [ ] 14.7 Actualizar `components/Reports/ReportsPage.tsx` para verificar permisos antes de mostrar reportes

## 15. Testing

- [ ] 15.1 Crear usuario de prueba con rol ADMIN (email: admin@test.com, password: Test123!)
- [ ] 15.2 Crear usuario de prueba con rol GERENTE (email: gerente@test.com, password: Test123!)
- [ ] 15.3 Crear usuario de prueba con rol TECNICO (email: tecnico@test.com, password: Test123!)
- [ ] 15.4 Crear usuario de prueba con rol ALIADO (email: aliado@test.com, password: Test123!, aliadoId: "TestSeguros")
- [ ] 15.5 Testear flujo de login con cada rol y validar redirección correcta
- [ ] 15.6 Testear que ADMIN puede crear, editar, desactivar usuarios
- [ ] 15.7 Testear que TECNICO no puede acceder a UserAdmin
- [ ] 15.8 Testear que ALIADO solo ve sus siniestros asignados
- [ ] 15.9 Testear que GERENTE puede ver ManagerDashboard
- [ ] 15.10 Testear que ADMIN puede ver AuditLog
- [ ] 15.11 Testear flujo de cambio de contraseña
- [ ] 15.12 Testear que sesión expira correctamente y redirige a login
- [ ] 15.13 Testear que audit_logs registra acciones correctamente
- [ ] 15.14 Testear migración completa en ambiente de staging con datos reales anonimizados

## 16. Documentación

- [x] 16.1 Actualizar README.md con instrucciones de configuración de Supabase Auth
- [x] 16.2 Crear documentación de API de servicios (users, audit, dashboard)
- [x] 16.3 Documentar roles y permisos en archivo ROLES.md
- [ ] 16.4 Crear guía de troubleshooting para problemas comunes de auth
- [ ] 16.5 Documentar proceso de migración de datos para futuras referencias
- [x] 16.6 Actualizar .env.example con variables necesarias (ya configuradas)

## 17. Deploy y Go-Live

- [ ] 17.1 Realizar backup completo de base de datos de producción
- [ ] 17.2 Poner aplicación en modo mantenimiento
- [ ] 17.3 Ejecutar script de migración de técnicos a usuarios
- [ ] 17.4 Verificar integridad de datos migrados
- [ ] 17.5 Desplegar nueva versión del código
- [ ] 17.6 Verificar que autenticación funciona correctamente
- [ ] 17.7 Crear usuarios iniciales en producción (ADMIN principal)
- [ ] 17.8 Notificar a usuarios sobre nuevo sistema de login
- [ ] 17.9 Quitar modo mantenimiento
- [ ] 17.10 Monitorear errores y logs durante las primeras 24 horas

## 18. Post-Deploy

- [ ] 18.1 Actualizar emails temporales de técnicos migrados con emails reales
- [ ] 18.2 Asignar roles correctos a usuarios migrados (verificar que todos sean TECNICOS)
- [ ] 18.3 Crear usuarios ALIADO reales y asignarles aliado_id correcto
- [ ] 18.4 Crear usuario GERENTE
- [ ] 18.5 Configurar política de retención de audit_logs (ej: mantener 2 años)
- [ ] 18.6 Revisar performance de queries con RLS y optimizar si es necesario
- [ ] 18.7 Recopilar feedback de usuarios sobre nuevo sistema
- [ ] 18.8 Planear mejoras futuras (2FA, recuperación de contraseña por email)
