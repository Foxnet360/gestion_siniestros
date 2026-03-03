## Context

El sistema SGS (Sistema de Gestión de Siniestros) actualmente utiliza autenticación simulada con MOCK_USERS hardcodeados. Los usuarios se autentican con contraseña fija '123456' y no existe persistencia real de usuarios en la base de datos. Este diseño aborda la migración a un sistema de autenticación real usando Supabase Auth con soporte para 4 roles: ADMIN, GERENTE, TECNICO y ALIADO.

**Stack tecnológico actual:**

- React 19 + TypeScript + Vite 6
- Supabase (PostgreSQL) para base de datos
- Tailwind CSS para UI
- @supabase/supabase-js ya instalado

**Estado actual del sistema:**

- `MOCK_USERS` en constants.ts con 4 usuarios de prueba
- Login.tsx con autenticación mock
- ClaimsContext maneja currentUser pero sin persistencia real
- Campo `tecnico_asignado` en claims es un string, no una relación
- No existe tabla de usuarios real en la base de datos
- No existe sistema de auditoría
- Roles existentes en types.ts: ADMIN, GERENTE, TECNICO, ALIADO

## Goals / Non-Goals

**Goals:**

- Implementar autenticación real con Supabase Auth usando email/password
- Crear tabla `users` en PostgreSQL con relación a Supabase Auth
- Desarrollar panel de administración CRUD para gestión de usuarios
- Implementar control de acceso basado en roles (RBAC) en frontend y backend
- Crear portal especializado para usuarios ALIADO con acceso restringido
- Desarrollar dashboard estratégico exclusivo para GERENTE
- Implementar sistema de auditoría que registre acciones críticas
- Migrar campo `tecnico_asignado` de string a foreign key real
- Permitir gestión de perfiles de usuario (cambiar contraseña, datos personales)
- Mantener compatibilidad con el sistema actual durante la migración

**Non-Goals:**

- No se implementará autenticación social (Google, Facebook, etc.) en esta fase
- No se incluirá autenticación de dos factores (2FA) inicialmente
- No se implementará recuperación de contraseña por email (se hará manualmente por admin)
- No se migrarán datos históricos de auditoría (se empieza desde cero)
- No se modificará la arquitectura general del sistema, solo el módulo de autenticación

## Decisions

### 1. Usar Supabase Auth nativo vs tabla de usuarios propia

**Decisión:** Usar Supabase Auth para autenticación + tabla `users` propia para metadatos adicionales

**Rationale:**

- Supabase Auth proporciona seguridad robusta (hashing, JWT, refresh tokens) sin implementarlo nosotros
- Tabla `users` permite almacenar metadatos específicos del negocio (role, initials, aliado_id, is_active)
- Relación 1:1 entre auth.users (Supabase) y public.users (nuestra tabla) usando UUID
- Evita duplicar lógica de seguridad ya resuelta por Supabase

**Alternativas consideradas:**

- Tabla de usuarios propia con bcrypt: Requiere implementar todo el flujo de auth manualmente, más propenso a errores de seguridad
- Firebase Auth: Buena opción pero ya tenemos Supabase configurado, mantener stack unificado reduce complejidad

### 2. Estrategia de roles: ENUM vs tabla de roles

**Decisión:** Usar TypeScript enum/string para roles, no tabla separada

**Rationale:**

- Solo 4 roles fijos (ADMIN, GERENTE, TECNICO, ALIADO) que raramente cambiarán
- Validación en TypeScript proporciona type safety en compile time
- Simplifica queries y joins
- Cambios de roles requieren deploy de código de todas formas (afectan lógica de negocio)

**Alternativas consideradas:**

- Tabla `roles` con permisos granulares: Más flexible pero overkill para necesidades actuales. Considerar si se necesitan permisos más finos en el futuro.

### 3. Enfoque de soft delete para usuarios

**Decisión:** Usar campo `is_active` booleano en lugar de eliminación física

**Rationale:**

- Preserva referencias históricas en audit_logs y siniestros
- Permite reactivar usuarios sin recrear todo
- Evita errores de foreign key constraints
- Regulaciones pueden requerir mantener historial de quién realizó acciones

**Alternativas consideradas:**

- Eliminación física: Riesgo de perder referencias históricas, problemas con foreign keys
- Tabla separada `deleted_users`: Añade complejidad innecesaria, dificulta queries

### 4. Arquitectura de componentes de autenticación

**Decisión:** Crear AuthProvider separado de ClaimsContext

**Rationale:**

- Separación de responsabilidades: AuthProvider maneja sesión/autenticación, ClaimsContext maneja datos de negocio
- AuthProvider puede reutilizarse si el contexto de claims cambia
- Facilita testing unitario de cada contexto
- Evita que ClaimsContext crezca demasiado

**Estructura propuesta:**

```
<AuthProvider>
  <ClaimsProvider>
    <App />
  </ClaimsProvider>
</AuthProvider>
```

### 5. Estrategia de migración de datos

**Decisión:** Script de migración que convierte técnicos únicos en usuarios

**Rationale:**

- Campo `tecnico_asignado` (string) contiene nombres como "Gonzalo Duque"
- Script creará un usuario por cada técnico único encontrado
- Asignará emails temporales (tecnico{n}@temp.softseguros.com)
- Administrador deberá actualizar emails reales post-migración
- IDs de nuevos usuarios se usarán para actualizar claims.tecnico_id

**Pasos del script:**

1. Extraer lista única de técnicos de claims.tecnico_asignado
2. Crear usuarios en auth.users y public.users para cada técnico
3. Actualizar claims.tecnico_id con UUID del usuario creado
4. Marcar claims antiguos sin técnico asignado con NULL

### 6. Estructura de RLS (Row Level Security)

**Decisión:** Políticas RLS en Supabase para control de acceso a nivel de fila

**Rationale:**

- Seguridad en el backend, no solo frontend
- Previene acceso no autorizado incluso si alguien accede directamente a la API
- Integración nativa con Supabase Auth

**Políticas propuestas:**

- `claims`: Usuarios ven siniestros donde son técnicos asignados, ALIADOS ven solo su organización
- `users`: Solo ADMIN puede ver/crear/editar usuarios. Usuarios pueden ver/editar su propio perfil
- `audit_logs`: Solo ADMIN y GERENTE pueden leer

### 7. Dashboard estratégico: Datos agregados vs en tiempo real

**Decisión:** Calcular métricas estratégicas en tiempo real con índices apropiados

**Rationale:**

- Volumen esperado: 10-50 usuarios, ~1000 siniestros
- Consultas agregadas con índices son suficientemente rápidas
- Evita complejidad de mantener tablas de agregación actualizadas
- Supabase maneja bien consultas analíticas con índices en created_at, estado_interno, aseguradora

**Índices necesarios:**

- claims(created_at, estado_interno)
- claims(aseguradora, fecha_ocurrencia)
- claims(tecnico_id, estado_interno)

## Risks / Trade-offs

**[RISK] Tiempo de downtime durante migración** → **Mitigation:** Script de migración debe ser idempotente y ejecutarse en maintenance window. Preparar rollback script que restaure claims.tecnico_asignado desde backup.

**[RISK] Usuarios con contraseña débil (123456)** → **Mitigation:** Forzar cambio de contraseña en primer login. Validar fortaleza de contraseña (mínimo 8 caracteres, 1 mayúscula, 1 número).

**[RISK] Performance de queries con RLS en tablas grandes** → **Mitigation:** Crear índices apropiados antes de activar RLS. Monitorear tiempos de query. Considerar materialized views si claims crece >10k registros.

**[RISK] Complejidad de mantener 4 vistas diferentes (ADMIN, GERENTE, TECNICO, ALIADO)** → **Mitigation:** Componentes reutilizables con prop `allowedRoles`. Tests E2E que validen cada rol vea solo lo autorizado.

**[RISK] Datos sensibles en audit_logs crecen indefinidamente** → **Mitigation:** Implementar política de retención (ej: mantener 2 años). Opción de archivar logs antiguos a storage S3 o similar.

**[TRADE-OFF] Usuarios ALIADO pueden ver solo sus siniestros** → **Impacto:** Si un aliado tiene muchos siniestros, queries pueden ser lentos. **Mitigación:** Paginación server-side obligatoria para ALIADO.

**[TRADE-OFF] GERENTE tiene acceso a dashboard estratégico con datos financieros sensibles** → **Impacto:** Mayor superficie de ataque si cuenta de gerente es comprometida. **Mitigación:** Recomendar contraseña fuerte, posible implementar 2FA en fase 2.

## Migration Plan

### Fase 1: Preparación (1 día)

1. Crear tablas `users` y `audit_logs` en Supabase
2. Configurar políticas RLS básicas
3. Crear índices necesarios
4. Desarrollar script de migración de técnicos
5. Backup completo de base de datos

### Fase 2: Migración de datos (2-3 horas downtime)

1. Poner sistema en modo mantenimiento
2. Ejecutar script de migración:
   - Extraer técnicos únicos de claims.tecnico_asignado
   - Crear usuarios en auth.users y public.users
   - Actualizar claims.tecnico_id con nuevos UUIDs
3. Verificar integridad de datos migrados
4. Actualizar campo `tecnico_asignado` → `tecnico_id` en código
5. Reactivar sistema

### Fase 3: Implementación frontend (3-4 días)

1. Crear AuthProvider con Supabase Auth
2. Refactorizar Login.tsx para autenticación real
3. Crear componentes:
   - UserAdmin.tsx (CRUD usuarios)
   - UserForm.tsx (crear/editar)
   - UserProfile.tsx (perfil propio)
   - AuditLog.tsx (ver auditoría)
   - ManagerDashboard.tsx (dashboard estratégico)
4. Implementar control de acceso por roles en rutas
5. Integrar audit trail en acciones críticas

### Fase 4: Testing y validación (1-2 días)

1. Crear usuarios de prueba para cada rol
2. Validar permisos en cada vista
3. Probar flujo completo: login → acciones → logout
4. Probar migración en ambiente de staging
5. Validar que datos históricos se mantienen correctamente

### Fase 5: Rollback plan

Si algo falla:

1. Restaurar backup de base de datos
2. Revertir código a versión anterior
3. Reactivar sistema con autenticación mock temporalmente
4. Investigar y corregir issue
5. Reintentar migración

## Open Questions

1. **¿Cuál es el volumen esperado de audit_logs?** Esto afecta estrategia de almacenamiento y retención. Necesitamos estimar acciones por día/usuario.

2. **¿Los ALIADOS necesitan crear casos nuevos o solo ver existentes?** Afecta permisos de escritura en claims.

3. **¿Existen técnicos que trabajen para múltiples aliados?** Afecta diseño de relación técnico-aliado.

4. **¿Qué métricas específicas necesita el dashboard de GERENTE?** Necesitamos definir KPIs exactos antes de implementar (rentabilidad por aseguradora, tiempos promedio de resolución, etc.)

5. **¿Se requiere sesiones concurrentes o un solo dispositivo por usuario?** Afecta configuración de JWT en Supabase.

6. **¿Cuántos siniestros tiene típicamente un ALIADO?** Esto determina si necesitamos optimizaciones específicas para queries de aliado.
