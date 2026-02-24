## ADDED Requirements

### Requirement: Comparativo mes actual vs mes anterior
El sistema DEBE permitir comparar métricas entre el mes actual y el mes anterior:
- Total reclamado
- Total indemnizado
- % recuperación
- Tiempo promedio de cierre
- Casos cerrados
- % objeciones

#### Scenario: Usuario compara mes actual vs anterior
- **WHEN** un usuario selecciona comparativo "Mes vs Mes"
- **THEN** el sistema muestra tabla con variación porcentual (↑↓)

### Requirement: Comparativo año actual vs año anterior
El sistema DEBE permitir comparar métricas entre años completos:
- Todas las métricas disponibles anualizadas
- Visualización gráfica de tendencias

#### Scenario: Usuario compara años
- **WHEN** un usuario selecciona comparativo "Año vs Año"
- **THEN** el sistema muestra comparativa completa con gráficos

### Requirement: Comparativo por aseguradora
El sistema DEBE permitir comparar el desempeño entre aseguradoras:
- Tiempo promedio de respuesta
- % de objeciones por aseguradora
- % reconsideraciones exitosas
- Tasa de cierre exitoso

#### Scenario: Gerencia compara aseguradoras
- **WHEN** un usuario accede al comparativo por aseguradora
- **THEN** el sistema muestra ranking de aseguradoras por desempeño
- **AND** incluye variación vs periodo anterior

### Requirement: Comparativo por ramo
El sistema DEBE permitir comparar métricas entre ramos:
- Duración promedio de gestión
- % recuperación promedio
- Volumen de casos
- % objeciones

#### Scenario: Análisis por línea de negocio
- **WHEN** un usuario selecciona comparativo por ramo
- **THEN** el sistema muestra tabla comparativa de todos los ramos

### Requirement: Ranking y benchmarking
El sistema DEBE generar rankings automáticos:
- Top/Bottom 5 aseguradoras por tiempo de respuesta
- Top/Bottom 5 técnicos por eficiencia
- Mejores/peores ramos por % recuperación

#### Scenario: Gerencia revisa rankings
- **WHEN** un usuario accede a la sección de rankings
- **THEN** el sistema muestra listas ordenadas con métricas clave

### Requirement: Tendencias y proyecciones
El sistema DEBE mostrar tendencias históricas:
- Evolución mensual de KPIs principales (últimos 12-24 meses)
- Proyección simple (tendencia lineal) para próximo trimestre
- Detección de patrones estacionales

#### Scenario: Análisis de tendencias
- **WHEN** un usuario visualiza tendencias históricas
- **THEN** el sistema muestra gráficos de línea con datos históricos
- **AND** incluye línea de tendencia proyectada
