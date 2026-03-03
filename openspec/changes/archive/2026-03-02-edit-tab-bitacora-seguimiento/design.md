## Context

### Background

El sistema actual de gestión de siniestros permite visualizar información de reclamaciones pero carece de un mecanismo estructurado para actualizar el seguimiento y mantener un historial auditable. Los funcionarios necesitan una forma centralizada de:

1. Actualizar el estado y próxima fecha de seguimiento de un siniestro
2. Registrar automáticamente quién realizó el cambio, cuándo y en qué estado quedó
3. Mantener una bitácora con formato consistente para auditoría y trazabilidad

### Current State

- El sistema tiene una vista de detalle de siniestros con pestañas existentes (probablemente "General", "Documentos", etc.)
- Existe una tabla `claims` con campos de seguimiento
- Existe o se necesita una tabla `timeline` o `bitacora` para historial
- El sistema usa autenticación (nombre de usuario disponible en contexto)
- La arquitectura es React + TypeScript + Vite + Supabase

### Constraints

- **Formato estricto obligatorio**: La bitácora debe seguir el patrón exacto: `Fecha: DD/MM/YYYY - Funcionario: [Nombre] - Seg: "[Estado]" [Descripción]`
- **Transaccionalidad**: Actualización de claim y creación de bitácora deben ser atómicas
- **UX consistente**: El formulario debe integrarse visualmente con el diseño existente (Tailwind CSS, tarjetas slate)
- **Validación frontend**: Fecha no puede ser en el pasado

### Stakeholders

- Funcionarios operativos: Usuarios finales que actualizan seguimiento
- Auditores: Revisan bitácora para trazabilidad
- Desarrolladores: Implementan y mantienen el sistema

## Goals / Non-Goals

**Goals:**

- Crear pestaña "Editar" en vista de detalle de siniestros
- Implementar formulario con campos: estado (dropdown), próxima fecha (date picker), descripción (textarea)
- Pre-diligenciar formulario con datos actuales del siniestro
- Actualizar campo "Próxima Fecha de ÚLTIMO SEGUIMIENTO" al guardar
- Generar entrada de bitácora con formato estricto al guardar
- Validar que la fecha de seguimiento no sea anterior a hoy
- Implementar transacción atómica (claim + bitácora)

**Non-Goals:**

- No se modifica la estructura de la tabla `claims` existente (solo se actualiza campo existente)
- No se implementa edición inline en tablas
- No se agrega notificaciones push/email al guardar
- No se implementa flujo de aprobación para cambios
- No se modifica el formato de bitácora existente (solo se agregan nuevas entradas)
- No se permite edición de entradas históricas de bitácora

## Decisions

### 1. Estructura de Componentes

**Decisión**: Crear componente `EditTrackingTab.tsx` separado en lugar de modificar componente existente.

**Rationale**:

- Separa responsabilidades: lógica de edición vs visualización
- Facilita testing unitario del formulario
- Permite lazy loading de la pestaña si es necesario
- Mantiene código organizado según convención del proyecto (un componente por archivo)

**Alternatives considered**:

- Modificar componente de detalle existente → Rechazado: aumentaría complejidad y acoplamiento
- Crear modal en lugar de pestaña → Rechazado: no cumple requerimiento de UX específico

### 2. Gestión de Estado del Formulario

**Decisión**: Usar `useState` local en el componente para manejar estado del formulario.

**Rationale**:

- Formulario simple con 3 campos, no requiere estado global
- Facilita reset al cambiar de siniestro
- No hay necesidad de compartir estado entre componentes

**Alternatives considered**:

- React Context → Rechazado: overkill para un solo formulario
- URL query params → Rechazado: no necesitamos persistir estado en URL

### 3. Formato de Fecha en Bitácora

**Decisión**: Formatear fecha como `DD/MM/YYYY` usando `date-fns` (ya dependencia del proyecto).

**Rationale**:

- Consistente con requerimiento de formato estricto
- `date-fns` ya está en el proyecto según AGENTS.md
- Formato localizado para Colombia

**Implementation approach**:

```typescript
import { format } from 'date-fns';
const bitacoraDate = format(new Date(), 'dd/MM/yyyy');
```

### 4. Estrategia de Transacción

**Decisión**: Usar Supabase RPC (Remote Procedure Call) para transacción atómica.

**Rationale**:

- Supabase PostgreSQL soporta funciones RPC
- Asegura atomicidad: ambas operaciones (update claim + insert timeline) en una sola llamada
- Manejo de errores más simple
- Evita inconsistencias si una operación falla

**Implementation**:

```sql
-- Función PostgreSQL
CREATE OR REPLACE FUNCTION update_tracking_with_bitacora(
  p_claim_id UUID,
  p_next_date DATE,
  p_status TEXT,
  p_description TEXT,
  p_user_name TEXT,
  p_formatted_entry TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE claims SET fecha_ultimo_seguimiento = p_next_date WHERE id = p_claim_id;
  INSERT INTO timeline (claim_id, entry, created_at, created_by)
  VALUES (p_claim_id, p_formatted_entry, NOW(), p_user_name);
END;
$$ LANGUAGE plpgsql;
```

**Alternatives considered**:

- Dos llamadas separadas desde frontend → Rechazado: riesgo de inconsistencia
- Trigger en base de datos → Rechazado: menos flexible, acopla lógica de negocio a schema

### 5. Obtención de Nombre de Usuario

**Decisión**: Obtener nombre de usuario desde contexto de autenticación existente.

**Rationale**:

- El sistema ya tiene autenticación implementada
- No requiere llamada adicional a base de datos

**Implementation**:

```typescript
// Asumiendo que existe un hook useAuth o similar
const { user } = useAuth();
const userName = user?.fullName || user?.email || 'Usuario desconocido';
```

### 6. Estados del Workflow

**Decisión**: Usar constante existente `WORKFLOW_PHASES` de `constants.ts` para opciones del dropdown.

**Rationale**:

- Ya existe en el proyecto según AGENTS.md
- Mantiene consistencia con estados usados en otras partes del sistema
- Facilita mantenimiento centralizado

### 7. Validación de Fecha

**Decisión**: Validación tanto en frontend (UX inmediata) como en backend (seguridad).

**Rationale**:

- Frontend: feedback inmediato al usuario
- Backend: protección contra manipulación directa de API

**Frontend implementation**:

```typescript
const isValidDate = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};
```

## Risks / Trade-offs

**[RISK] Formato de bitácora demasiado rígido**
→ El formato estricto puede dificultar búsquedas o análisis posterior.
→ **Mitigation**: Considerar almacenar también campos separados (fecha, usuario, estado) en columnas adicionales en la tabla timeline para facilitar queries, manteniendo el campo `entry` con formato legible para humanos.

**[RISK] Nombre de usuario no disponible**
→ Si el contexto de autenticación solo tiene email pero no nombre completo, la bitácora mostrará email en lugar de nombre.
→ **Mitigation**: Implementar fallback (email si no hay nombre) y documentar que es preferible tener nombre completo en perfil de usuario.

**[RISK] Concurrencia en actualizaciones**
→ Dos usuarios editando el mismo siniestro simultáneamente pueden sobrescribirse.
→ **Mitigation**: Agregar campo `updated_at` con optimistic locking o usar timestamp de edición. Para MVP, aceptar riesgo bajo de concurrencia.

**[RISK] Dependencia de Supabase RPC**
→ Si se migra de Supabase a otro backend, la función RPC debe reimplementarse.
→ **Mitigation**: Documentar claramente la dependencia; encapsular en servicio `trackingService.ts` para facilitar migración futura.

**[TRADE-OFF] Validación de fecha futura**
→ Algunos casos de uso podrían requerir fechas pasadas (corrección de errores).
→ **Mitigation**: Validación puede relajarse a futuro si hay caso de uso legítimo; por ahora, seguir requerimiento estricto.

**[TRADE-OFF] Acoplamiento temporal**
→ El formato de bitácora está hardcodeado en el código; cambios requieren modificar código.
→ **Mitigation**: Aceptable para MVP; si el formato cambia frecuentemente, considerar template configurable.

## Migration Plan

### Deploy Steps

1. **Database Migration**:
   - Crear función PostgreSQL `update_tracking_with_bitacora`
   - Verificar que tabla `timeline` tiene columnas necesarias (`claim_id`, `entry`, `created_at`, `created_by`)

2. **Code Deployment**:
   - Desplegar componente `EditTrackingTab.tsx`
   - Modificar vista de detalle para incluir nueva pestaña
   - Desplegar servicio `trackingService.ts`

3. **Validation**:
   - Verificar que la pestaña aparece en vista de detalle
   - Probar guardado con datos de prueba
   - Verificar formato de bitácora generada
   - Confirmar transacción atómica (rollback si falla)

### Rollback Strategy

- **Código**: Revertir commit; pestaña desaparece automáticamente
- **Database**: Función RPC puede eliminarse sin afectar datos existentes (solo operaciones nuevas)
- **Datos**: Entradas de bitácora creadas permanecen (no afecta integridad)

## Open Questions

1. **¿Existe ya la tabla `timeline` o se debe crear?**
   - Verificar schema actual de base de datos
   - Si no existe, definir columnas: `id`, `claim_id`, `entry` (TEXT), `created_at`, `created_by`

2. **¿El campo de fecha en tabla claims se llama exactamente `fecha_ultimo_seguimiento`?**
   - Verificar nombre real del campo en base de datos
   - Puede ser `proxima_fecha_seguimiento` o similar

3. **¿El usuario autenticado tiene propiedad `fullName` o es diferente?**
   - Verificar estructura de objeto usuario en contexto de autenticación
   - Puede ser `displayName`, `name`, etc.

4. **¿Hay necesidad de notificar a otros usuarios cuando se actualiza un seguimiento?**
   - Actualmente fuera de scope (Non-Goal), pero confirmar si es necesidad futura

5. **¿Se requiere permisos especiales para editar seguimiento o cualquier usuario autenticado puede hacerlo?**
   - Verificar si hay roles (admin, operador, etc.) que restringan esta funcionalidad
