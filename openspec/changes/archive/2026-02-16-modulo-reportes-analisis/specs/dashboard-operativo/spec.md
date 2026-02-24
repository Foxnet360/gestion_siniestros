## ADDED Requirements

### Requirement: Productividad por técnico
El dashboard DEBE mostrar métricas de productividad para cada técnico:
- Casos activos asignados (no finalizados)
- Casos cerrados en el periodo (finalizado = SI)
- Tiempo promedio de cierre (días)
- % recuperación (indemnización / reclamo)
- Casos estancados (> X días sin movimiento, X configurable, default: 30)

#### Scenario: Coordinador visualiza productividad del equipo
- **WHEN** un usuario ADMIN accede al Dashboard Operativo
- **THEN** el sistema muestra tabla comparativa de todos los técnicos
- **AND** incluye ranking por eficiencia

### Requirement: Detalle por técnico
El dashboard DEBE permitir hacer clic en un técnico para ver:
- Lista de casos activos asignados
- Casos estancados destacados
- Tiempos promedio por fase para ese técnico

#### Scenario: Coordinador revisa detalle de técnico
- **WHEN** un usuario hace clic en el nombre de un técnico
- **THEN** el sistema muestra vista detallada con sus casos

### Requirement: Identificación de cuellos de botella
El dashboard DEBE identificar y visualizar cuellos de botella:
- Distribución de casos por fase del workflow (gráfico de pastel/barras)
- Fases con mayor acumulación de casos
- Tiempo promedio por fase vs meta

#### Scenario: Sistema detecta cuello de botella
- **WHEN** una fase acumula >20% de casos activos
- **THEN** el sistema resalta esa fase con color de alerta

### Requirement: Casos estancados
El dashboard DEBE listar los casos estancados (> X días sin movimiento):
- Filtro configurable por número de días (default: 30)
- Ordenados por días sin movimiento (mayor primero)
- Indicador visual de antigüedad

#### Scenario: Coordinador revisa casos estancados
- **WHEN** un usuario accede a la sección de casos estancados
- **THEN** el sistema muestra lista de casos ordenados por antigüedad
- **AND** permite filtrar por técnico asignado

### Requirement: Alertas de casos críticos
El dashboard DEBE mostrar alertas visuales para:
- Casos estancados > 45 días
- Técnicos con productividad por debajo del promedio
- Fases del workflow con tiempos excediendo meta

#### Scenario: Sistema muestra alertas en dashboard
- **WHEN** existen casos que cumplen criterios de alerta
- **THEN** el dashboard muestra badges/notificaciones visuales
