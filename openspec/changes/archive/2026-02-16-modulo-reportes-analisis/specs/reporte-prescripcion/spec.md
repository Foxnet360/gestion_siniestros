## ADDED Requirements

### Requirement: Clasificación automática por nivel de riesgo
El reporte DEBE clasificar automáticamente cada siniestro según días restantes para prescripción:
- 🔴 Alto Riesgo: < 30 días para prescribir
- 🟡 Riesgo Medio: 30-60 días para prescribir
- 🟢 Bajo Riesgo: > 60 días para prescribir

#### Scenario: Sistema clasifica siniestros por riesgo
- **WHEN** el reporte se carga
- **THEN** cada siniestro se clasifica según días restantes hasta prescripcion_ordinaria
- **AND** se muestra el indicador visual correspondiente (🔴🟡🟢)

### Requirement: Campos obligatorios en el reporte
El reporte DEBE mostrar una tabla con los siguientes campos para cada siniestro:
- Número de siniestro
- Cliente (asegurado)
- Aseguradora
- Ramo
- Responsable (técnico_asignado)
- Fecha de aviso (fecha_aviso)
- Fecha de prescripción (prescripcion_ordinaria)
- Días restantes (calculado)
- Última gestión realizada (último evento del timeline)
- Días sin movimiento (calculado desde lastStateChangeDate)

#### Scenario: Usuario visualiza reporte de prescripción
- **WHEN** un usuario ADMIN abre el Reporte Crítico de Prescripción
- **THEN** el sistema muestra tabla con todos los campos obligatorios
- **AND** los valores calculados se actualizan en tiempo real

### Requirement: Ordenamiento automático por riesgo
El reporte DEBE ordenar automáticamente los siniestros mostrando primero los de mayor riesgo (menos días restantes).

#### Scenario: Tabla ordenada por riesgo
- **WHEN** el reporte se carga
- **THEN** los siniestros se ordenan ascendentemente por días restantes
- **AND** los de 🔴 Alto Riesgo aparecen primero

### Requirement: Filtros específicos del reporte
El reporte DEBE permitir filtrar por:
- Nivel de riesgo (Alto/Medio/Bajo)
- Cliente/Compañía
- Aseguradora
- Ramo
- Estado interno
- Técnico responsable
- Vendedor

#### Scenario: Usuario filtra por nivel de riesgo
- **WHEN** un usuario selecciona "🔴 Alto Riesgo" en los filtros
- **THEN** el reporte muestra solo siniestros con < 30 días restantes

### Requirement: Acciones desde el reporte
El reporte DEBE permitir las siguientes acciones sobre cada siniestro:
- Ver detalle completo (navega a ClaimDetail)
- Asignar/editar prioridad
- Agregar nota/gestión (actualiza timeline)

#### Scenario: Usuario accede al detalle desde el reporte
- **WHEN** un usuario hace clic en un número de siniestro
- **THEN** el sistema abre el modal de ClaimDetail para ese siniestro

### Requirement: Exportación del reporte
El reporte DEBE permitir exportar la tabla filtrada a:
- Excel (.xlsx) con formato de tabla
- PDF tipo informe ejecutivo con los casos críticos destacados

#### Scenario: Usuario exporta reporte a Excel
- **WHEN** un usuario hace clic en "Exportar Excel"
- **THEN** el sistema descarga un archivo .xlsx con los datos filtrados
