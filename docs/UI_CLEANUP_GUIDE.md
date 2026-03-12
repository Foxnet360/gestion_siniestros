# Guía de Limpieza de UI - Estados Obsoletos

## Resumen

Esta guía documenta el proceso para identificar y remover estados obsoletos del sistema SGS después de la implementación del módulo SLA y Dashboard de KPIs.

## Contexto

Con la nueva implementación del sistema de etapas (16 etapas automatizadas), es probable que algunos estados manuales anteriores ya no sean necesarios.

## Proceso de Identificación

### Paso 1: Análisis de Estados Actuales

Ejecutar script para identificar todos los estados en uso:

```bash
#!/bin/bash
# find-states.sh

echo "=== Estados en la base de datos ==="
psql -d your_database -c "SELECT DISTINCT estado FROM claims ORDER BY estado;"

echo ""
echo "=== Estados en el código fuente ==="
grep -r "estado" src/ --include="*.ts" --include="*.tsx" | grep -E "(const|let|enum)" | head -20

echo ""
echo "=== Estados en constantes ==="
cat src/constants.ts | grep -A 20 "ESTADOS\|STATES"
```

### Paso 2: Mapeo de Estados

Crear tabla de mapeo entre estados antiguos y nuevas etapas:

| Estado Antiguo         | Etapa Nueva                      | Acción Recomendada  |
| ---------------------- | -------------------------------- | ------------------- |
| `EN_REVISION`          | Etapa 3 (Ajustador)              | Migrar a etapa      |
| `PENDIENTE_DOCUMENTOS` | Etapa 4 (Documentos Adicionales) | Migrar a etapa      |
| `EN_LIQUIDACION`       | Etapa 6 (Liquidación)            | Migrar a etapa      |
| `OBJETADO`             | Etapa 7 (Objeción)               | Migrar a etapa      |
| `DESISTIDO`            | Etapa 10 (Desistimiento)         | Migrar a etapa      |
| `FINALIZADO`           | Etapa 15 (Finalizado)            | Mantener/Consolidar |
| `CERRADO`              | Etapa 16 (Pagado)                | Mantener/Consolidar |

### Paso 3: Verificar Uso en Componentes

```bash
#!/bin/bash
# check-state-usage.sh

ESTADOS=("EN_REVISION" "PENDIENTE_DOCUMENTOS" "EN_LIQUIDACION" "OBJETADO" "DESISTIDO")

for estado in "${ESTADOS[@]}"; do
  echo "=== Buscando: $estado ==="
  grep -r "$estado" src/ --include="*.tsx" --include="*.ts" -l
  echo ""
done
```

## Tareas de Limpieza

### 6.1 Identificar Estados Obsoletos

- [ ] Listar todos los estados actuales en BD
- [ ] Listar todos los estados en código
- [ ] Identificar duplicados con etapas SLA
- [ ] Documentar dependencias
- [ ] Validar con equipo de negocio

### 6.2 Remover Estados de Dropdowns

Archivos típicos a revisar:

- `src/components/ClaimForm/StatusSelect.tsx`
- `src/components/Filters/StatusFilter.tsx`
- `src/constants.ts` (enum de estados)

Ejemplo de limpieza:

```typescript
// ANTES
export enum ClaimStatus {
  NUEVO = 'NUEVO',
  EN_REVISION = 'EN_REVISION', // ← OBSOLETO
  PENDIENTE_DOCUMENTOS = 'PENDIENTE_DOCUMENTOS', // ← OBSOLETO
  EN_LIQUIDACION = 'EN_LIQUIDACION', // ← OBSOLETO
  OBJETADO = 'OBJETADO', // ← OBSOLETO
  DESISTIDO = 'DESISTIDO', // ← OBSOLETO
  FINALIZADO = 'FINALIZADO',
  CERRADO = 'CERRADO',
}

// DESPUÉS
export enum ClaimStatus {
  NUEVO = 'NUEVO',
  ACTIVO = 'ACTIVO', // Genérico para en proceso
  FINALIZADO = 'FINALIZADO',
  CERRADO = 'CERRADO',
}
```

### 6.3 Actualizar Filtros

```typescript
// ANTES - StatusFilter.tsx
const statusOptions = [
  { value: 'NUEVO', label: 'Nuevo' },
  { value: 'EN_REVISION', label: 'En Revisión' },
  { value: 'PENDIENTE_DOCUMENTOS', label: 'Pendiente Documentos' },
  // ... más estados
];

// DESPUÉS
const statusOptions = [
  { value: 'NUEVO', label: 'Nuevo' },
  { value: 'ACTIVO', label: 'En Proceso' },
  { value: 'FINALIZADO', label: 'Finalizado' },
  { value: 'CERRADO', label: 'Cerrado' },
];
```

### 6.4 Actualizar Referencias Hardcodeadas

Buscar y reemplazar en todo el código:

```bash
# Buscar referencias hardcodeadas
grep -r "'EN_REVISION'\|\"EN_REVISION\"" src/ --include="*.ts" --include="*.tsx"
grep -r "'PENDIENTE_DOCUMENTOS'\|\"PENDIENTE_DOCUMENTOS\"" src/ --include="*.ts" --include="*.tsx"
# ... etc
```

### 6.5 Testing Post-Limpieza

Checklist de validación:

- [ ] Crear siniestro nuevo funciona
- [ ] Editar siniestro funciona
- [ ] Filtros por estado funcionan
- [ ] Reportes generan correctamente
- [ ] Dashboard muestra datos correctos
- [ ] No hay errores en consola
- [ ] Migración de datos histórica mantiene integridad

## Script de Migración de Estados

```sql
-- migrate-states.sql
-- Migrar estados antiguos a nuevos

BEGIN;

-- Actualizar estados obsoletos a ACTIVO
UPDATE claims
SET estado = 'ACTIVO'
WHERE estado IN ('EN_REVISION', 'PENDIENTE_DOCUMENTOS', 'EN_LIQUIDACION');

-- Mantener estados finales
-- FINALIZADO y CERRADO se mantienen

-- Verificar conteos
SELECT estado, COUNT(*)
FROM claims
GROUP BY estado
ORDER BY estado;

COMMIT;
```

## Rollback Plan

Si algo sale mal:

```sql
-- rollback-states.sql
-- Restaurar estados desde backup

-- 1. Restaurar desde tabla de backup
UPDATE claims c
SET estado = b.estado_backup
FROM claims_backup b
WHERE c.id = b.id;
```

## Consideraciones Importantes

1. **Backup**: Siempre hacer backup antes de cualquier cambio
2. **Staging**: Probar primero en ambiente de staging
3. **Comunicación**: Notificar a usuarios sobre cambios
4. **Migración**: Planificar migración de datos históricos
5. **Documentación**: Actualizar documentación de usuario

## Estados Mantenidos

Estos estados se mantienen por compatibilidad:

- `NUEVO`: Siniestro recién creado
- `ACTIVO`: En proceso (consolida varios estados antiguos)
- `FINALIZADO`: Proceso administrativo completado
- `CERRADO`: Pagado y archivado

## Timeline Sugerido

1. **Semana 1**: Identificación y análisis
2. **Semana 2**: Desarrollo de cambios
3. **Semana 3**: Testing en staging
4. **Semana 4**: Deploy a producción

## Contactos

- **Líder Técnico**: [Nombre] - [Email]
- **DBA**: [Nombre] - [Email]
- **Product Owner**: [Nombre] - [Email]

---

**Nota**: Esta guía debe ejecutarse con acceso al código fuente completo y base de datos.

**Fecha de creación**: Marzo 2024  
**Versión**: 1.0
