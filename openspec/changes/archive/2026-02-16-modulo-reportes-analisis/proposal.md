## Why

El sistema actual de gestión de siniestros carece de capacidades avanzadas de reportes y análisis estratégico. La alta gerencia y el equipo operativo necesitan herramientas para tomar decisiones basadas en datos: controlar el riesgo de prescripción, medir eficiencia operativa, negociar con aseguradoras con argumentos sólidos, y reducir tiempos de gestión. Sin estos reportes, la gestión es reactiva en lugar de proactiva.

## What Changes

- **Nuevo módulo de Reportes** accesible desde el sidebar (rol ADMIN)
- **Dashboard Gerencial** con KPIs financieros y operativos en tiempo real
- **Reporte Crítico de Prescripción** con clasificación automática por riesgo (🔴🟡🟢)
- **Métricas de tiempo** calculadas desde fecha aviso hasta fecha finalización
- **Dashboard Operativo** con productividad por técnico y cuellos de botella
- **Análisis Comparativo** (mes vs mes, año vs año, aseguradora vs aseguradora)
- **Exportación a Excel** con datos formateados y dashboards
- **Exportación a PDF** como informes ejecutivos estructurados
- **Filtros dinámicos** combinables por fechas, ramo, aseguradora, técnico
- **Nuevas dependencias**: `chart.js`, `react-chartjs-2`, `jspdf`, `html2canvas`

## Capabilities

### New Capabilities
- `dashboard-gerencial`: Dashboard con KPIs financieros y operativos para alta gerencia
- `reporte-prescripcion`: Reporte crítico de casos próximos a prescribir con alertas visuales
- `metricas-tiempo`: Cálculo y visualización de tiempos de gestión por fase y dimensión
- `dashboard-operativo`: Dashboard de productividad por técnico y cuellos de botella
- `analisis-comparativo`: Comparativos temporales y entre entidades (aseguradoras, ramos)
- `exportacion-reportes`: Exportación a Excel y PDF de reportes formateados

### Modified Capabilities
- *Ninguna capacidad existente modifica sus requisitos*

## Impact

- **Nueva ruta/vista**: `/reportes` con selector de reportes tipo dashboard
- **Componentes nuevos**: 15+ componentes en `components/Reports/`
- **Hooks nuevos**: 5+ hooks para cálculos de KPIs y métricas
- **Servicios nuevos**: Exportación Excel y PDF
- **Dependencias**: 4 nuevas librerías para gráficos y PDFs
- **Base de datos**: Usa tablas existentes (`claims`, `state_history`, `timeline`)
- **Performance**: Queries optimizadas con índices existentes, carga <3 segundos
