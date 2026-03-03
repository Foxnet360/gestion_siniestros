<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Sistema de Gestión de Siniestros (SGS)

Sistema integral para la gestión de siniestros de seguros, con integración inteligente desde SoftSeguros CRM.

## Características Principales

- 📊 **Dashboards Gerenciales y Operativos** - Reportes ejecutivos con exportación PDF/Excel
- 🔄 **Ingesta Inteligente** - Sincronización preservando datos internos
- 📋 **Gestión de Estados** - Workflow completo de fases del siniestro
- ⚠️ **Alertas de Prescripción** - Detección automática de riesgos
- 📈 **Métricas de Tiempo** - Análisis de eficiencia por fase y aseguradora
- 🎯 **Gestión de Amparos** - Sincronización de coberturas desde CRM

## Ejecutar Localmente

**Prerrequisitos:** Node.js 18+

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# Ejecutar en desarrollo
npm run dev
```

## Configuración de Autenticación (Supabase Auth)

El sistema utiliza Supabase Auth para autenticación de usuarios. Sigue estos pasos para configurar:

### 1. Configurar Supabase Dashboard

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.io)
2. Navega a **Authentication > Providers**
3. Habilita **Email** provider
4. Configura:
   - **Confirm email**: OFF (para auto-confirmar usuarios)
   - **Secure email change**: ON
   - **Secure password change**: ON

### 2. Configurar JWT Settings

1. Ve a **Project Settings > API**
2. En **JWT Settings**:
   - **JWT expiry**: 86400 (24 horas)
   - **Refresh token rotation**: ON

### 3. Ejecutar Migración SQL

Ejecuta el script de migración en el SQL Editor de Supabase:

```bash
# Ubicación del script
database/migrations/001_create_user_management.sql
```

Este script crea:

- Tabla `users` (metadatos de usuarios)
- Tabla `audit_logs` (registro de auditoría)
- Columna `tecnico_id` en tabla `claims`
- Políticas RLS para control de acceso
- Funciones para auditoría automática

### 4. Crear Primer Usuario ADMIN

Ejecuta en SQL Editor:

```sql
SELECT create_user_with_auth(
    'admin@softseguros.com',
    'Admin123!',
    'Administrador Principal',
    'ADMIN',
    'AP'
);
```

### 5. Sistema de Roles

El sistema tiene 4 roles:

- **ADMIN**: Control total del sistema
- **GERENTE**: Dashboard gerencial y reportes
- **TECNICO**: Gestión de siniestros asignados
- **ALIADO**: Visualización de siniestros propios

Ver [ROLES.md](./ROLES.md) para documentación completa de permisos.

### 6. Migración de Técnicos Existentes

Si tienes técnicos en el campo `tecnico_asignado` (string), ejecuta:

```bash
# Configura SUPABASE_SERVICE_ROLE_KEY en .env
npx ts-node scripts/migrate-tecnicos.ts
```

Este script:

1. Extrae técnicos únicos del campo `tecnico_asignado`
2. Crea usuarios en auth.users y public.users
3. Actualiza `claims.tecnico_id` con los UUIDs generados

## Documentación del Sistema

### Modelo de Propiedad de Campos (Field Ownership)

El sistema clasifica cada campo del siniestro en una de tres categorías:

| Categoría             | Cantidad | Estrategia de Actualización        | Ejemplos                                                                 |
| --------------------- | -------- | ---------------------------------- | ------------------------------------------------------------------------ |
| **SoftSeguros-owned** | 24       | Siempre actualizar desde Excel     | `poliza`, `asegurado`, `estado_softseguros`, `monto_reclamo`             |
| **Internal-only**     | 9        | Nunca modificar durante ingestión  | `tecnico_asignado`, `prioridad`, `proximo_seguimiento`, `estado_interno` |
| **Hybrid**            | 2        | Lógica especial desde hoja Gestión | `gestion_softseguros`, `estado_gestion_softseguros`                      |

Esta clasificación previene pérdida accidental de datos y hace la lógica de merge determinista.

#### Campos SoftSeguros-owned (24)

```typescript
// Datos principales del CRM
(id_softseguros, numero_siniestro, poliza, asegurado);
(estado_softseguros, usuario_registro, ultimo_seguimiento_raw);
(placa_bien, ramo, aseguradora, vendedor, monto_reclamo);
(valor_deducible, valor_indemnizacion, fecha_ocurrencia);

// Campos adicionales del CRM
(numero_siniestro_compania, tipo_siniestro, fecha_aviso);
(fecha_notificacion_aseguradora, proveedor_asignado, descripcion);
(documento_asegurado, email_principal, celular_principal);
(porcentaje_siniestralidad, finalizado, fecha_finalizacion, coaseguros);
```

#### Campos Internal-only (9)

```typescript
// Gestión interna (no se sobrescriben)
(id_interno, estado_interno, lastStateChangeDate);
(stateHistory, prioridad, tecnico_asignado);
(aliado_origen, timeline, updatedAt, proximo_seguimiento);
```

#### Campos Calculated (2)

```typescript
// Calculados automáticamente desde fecha_ocurrencia
prescripcion_ordinaria; // fecha_siniestro + 2 años
prescripcion_extraordinaria; // fecha_siniestro + 5 años
```

### Proceso de Ingesta y Merge

El sistema implementa una estrategia de merge inteligente que:

1. **Parsea el Excel** → Extrae campos y convierte a tipos TypeScript
2. **Compara campo por campo** → Usa igualdad estricta con normalización
3. **Detecta cambios de estado** → Actualiza automáticamente el historial
4. **Parsea último seguimiento** → Convierte texto estructurado a timeline
5. **Merge de amparos** → Sincroniza coberturas usando clave compuesta
6. **Reporta estadísticas** → Proporciona métricas detalladas de la ingestión

#### Flujo de Datos

```
Excel (SoftSeguros CRM)
    ↓
excelParser.ts → Claim[] + Amparo[]
    ↓
mergeService.ingestClaims()
    ├─ Para cada claim:
    │   ├─ Buscar existente por id_softseguros
    │   ├─ Comparar campos SoftSeguros-owned
    │   ├─ Si estado cambió → handleStateChange()
    │   ├─ Si seguimiento cambió → handleUltimoSeguimientoChange()
    │   └─ mergeAmparos() → Insert/Update/Delete
    ↓
Supabase DB (claims, amparos, state_history, timeline)
```

#### Reporte de Ingesta

```typescript
interface IngestionReport {
  claims: {
    created: number; // Nuevos siniestros creados
    updated: number; // Siniestros actualizados
    unchanged: number; // Siniestros sin cambios
  };
  amparos: {
    inserted: number; // Nuevos amparos agregados
    updated: number; // Amparos con valor modificado
    deleted: number; // Amparos eliminados
  };
  duration_ms: number; // Tiempo total de procesamiento
}
```

**Ejemplo de reporte:**

```
✓ Ingesta completada en 2.3 segundos

Siniestros:
  • 145 creados
  • 892 actualizados
  • 2,103 sin cambios

Amparos:
  • 312 insertados
  • 45 actualizados
  • 23 eliminados
```

### Tipos Principales

#### Amparo

```typescript
interface Amparo {
  id: string; // UUID autogenerado
  claim_id: string; // FK a claims.id_softseguros
  numero_siniestro: string; // Número del siniestro
  nombre_reclamante: string; // Nombre del reclamante
  amparo: string; // Tipo de cobertura/amparo
  valor: number; // Valor monetario
  created_at: string; // Fecha de creación ISO
}
```

Los amparos se sincronizan usando una **clave compuesta** (`amparo + nombre_reclamante`) para identificar registros únicos.

#### Claim

Ver [`types.ts`](./types.ts) para la definición completa con anotaciones `@ownership`.

### Servicios

#### mergeService.ts

Funciones principales para la ingestión inteligente:

- **`mergeClaimFromExcel(excelRow, existingClaim)`** - Merge de un siniestro individual
- **`mergeAmparos(claimId, excelAmparos)`** - Sincronización de amparos
- **`ingestClaims(claims, amparos)`** - Proceso batch completo
- **`parseUltimoSeguimiento(raw)`** - Parser de seguimiento estructurado
- **`handleStateChange(claimId, oldState, newState)`** - Actualización de historial de estados

#### excelParser.ts

Parseo de archivos Excel de SoftSeguros:

- Mapeo de 24 campos desde hoja "Siniestros"
- Parseo de hoja "Amparos" con validación
- Conversión de tipos (fechas, moneda, booleanos)

#### trackingService.ts

Servicio para gestionar actualizaciones de seguimiento y bitácora:

- **`formatBitacoraEntry(date, userName, status, description)`** - Formatea entrada según patrón estricto
- **`saveTrackingUpdate(data)`** - Guarda seguimiento y crea entrada en bitácora (transacción atómica)
- **`isValidFutureDate(date)`** - Valida que fecha no sea anterior a hoy
- **`getAllWorkflowStates()`** - Obtiene todos los estados disponibles del workflow

### Funcionalidad de Edición de Seguimiento

El sistema incluye una pestaña "Editar" en el detalle de siniestros que permite:

1. **Actualizar estado** del siniestro mediante dropdown
2. **Establecer próxima fecha** de seguimiento (validación: no permite fechas pasadas)
3. **Agregar descripción** del seguimiento (máximo 2000 caracteres)
4. **Generar automáticamente entrada en bitácora** con formato estricto:
   ```
   Fecha: DD/MM/YYYY - Funcionario: [Nombre] - Seg: "[Estado]" [Descripción]
   ```

#### Transacción Atómica

El guardado utiliza una función PostgreSQL (`update_tracking_with_bitacora`) que garantiza atomicidad:

- Actualiza el campo `proximo_seguimiento` en la tabla `claims`
- Inserta nueva entrada en tabla `timeline`
- Ambas operaciones ocurren en una sola transacción (rollback automático si falla)

#### Migración de Base de Datos

Ver archivo: `database/migrations/001_add_tracking_functionality.sql`

Incluye:

- Verificación/creación de tabla `timeline`
- Creación de función RPC `update_tracking_with_bitacora`
- Índices para optimización de queries

## Testing

### Estrategia de Testing Manual

Dado que el proyecto no tiene framework de testing configurado, se recomienda el siguiente proceso manual:

#### Test de `parseUltimoSeguimiento()`

1. **Formato estructurado válido:**

   ```
   Fecha: 15/01/2024 - Funcionario: Juan Pérez - Seguimiento: "EN GESTIÓN" Pendiente documentación
   ```

   → Debe extraer fecha, funcionario, y texto del seguimiento

2. **Formato no estructurado:**

   ```
   Revisión de caso en proceso
   ```

   → Debe almacenar como texto sin parsear

3. **Campos vacíos:**
   ```
   (empty string o null)
   ```
   → Debe retornar null

#### Test de `mergeClaimFromExcel()`

1. **Nuevo siniestro:**
   - Subir Excel con id_softseguros nuevo
   - Verificar que se crea con defaults internos
   - Verificar que se crea entrada en state_history

2. **Siniestro existente sin cambios:**
   - Subir mismo Excel dos veces
   - Segunda vez debe reportar "unchanged"
   - No debe crear entradas adicionales en timeline

3. **Cambio de estado:**
   - Modificar estado_softseguros en Excel
   - Verificar que se actualiza el claim
   - Verificar que se crea entrada en state_history
   - Verificar que se crea entrada en timeline

4. **Cambio de seguimiento:**
   - Modificar ultimo_seguimiento_raw
   - Verificar que se parsea correctamente
   - Verificar que se inserta en timeline

#### Test de `mergeAmparos()`

1. **Nuevos amparos:**
   - Agregar amparos en Excel
   - Verificar que se insertan en DB

2. **Actualización de valor:**
   - Cambiar valor de amparo existente
   - Verificar que se actualiza en DB

3. **Eliminación:**
   - Quitar amparo del Excel
   - Verificar que se elimina de DB

#### Test de Flujo Completo

1. Preparar Excel de prueba con:
   - 5 siniestros nuevos
   - 3 siniestros con cambios de estado
   - 2 siniestros sin cambios
   - Varios amparos de cada tipo

2. Ejecutar ingestión

3. Verificar reporte de ingestión:
   - Claims: created=5, updated=3, unchanged=2
   - Amparos: inserted=X, updated=Y, deleted=Z

4. Verificar base de datos:
   - Siniestros creados con campos correctos
   - State_history con entradas para cambios de estado
   - Timeline con seguimientos parseados
   - Amparos sincronizados correctamente

#### Test con Excel Real de SoftSeguros

1. Solicitar archivo Excel de producción (anónimo)
2. Ejecutar ingestión en ambiente de staging
3. Verificar:
   - Todos los 24 campos SoftSeguros poblados
   - Campos internos preservados
   - Estados generan timeline
   - Seguimientos se parsean correctamente
   - Tabla de amparos poblada
   - Reporte de ingestión preciso

## Arquitectura

### Estructura de Directorios

```
├── components/          # Componentes React
│   ├── Reports/        # Módulo de reportes
│   │   ├── DashboardGerencial/
│   │   ├── DashboardOperativo/
│   │   ├── MetricasTiempo/
│   │   ├── AnalisisComparativo/
│   │   └── ReportePrescripcion/
│   └── Ingest.tsx      # Componente de ingestión
├── context/            # React Context
│   └── ClaimsContext.tsx
├── services/           # Lógica de negocio
│   ├── excelParser.ts  # Parseo de Excel
│   ├── mergeService.ts # Merge inteligente
│   └── reports/        # Exportación de reportes
├── types.ts            # Definiciones TypeScript
├── constants.ts        # Constantes del sistema
└── lib/                # Configuraciones externas
    └── supabase.ts
```

### Tecnologías

- **Frontend:** React 19 + TypeScript + Vite 6
- **Estilos:** Tailwind CSS
- **Base de Datos:** Supabase (PostgreSQL)
- **Reportes:** jsPDF + html2canvas, xlsx-js
- **Fechas:** date-fns
- **Iconos:** Lucide React

## Variables de Entorno

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo (puerto 3000)
npm run build    # Build de producción
npm run preview  # Preview del build
npx tsc --noEmit # Verificación de tipos
```

## Licencia

Propietario - Foxnet360
