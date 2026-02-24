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
