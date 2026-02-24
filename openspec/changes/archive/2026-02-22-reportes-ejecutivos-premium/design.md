# Design: Arquitectura de Exportación Ejecutiva

## Decisiones Técnicas

### 1. Servicio de PDF (jsPDF + html2canvas)
*   Se abandonará el enfoque de "todo-a-canvas" por uno mixto.
*   **Portada y Estructura**: Dibujada directamente con comandos de `jsPDF` para máxima nitidez de texto.
*   **Gráficos**: Capturados individualmente con `html2canvas` para ser insertados como imágenes en posiciones específicas.
*   **Tablas**: Se implementará un generador de tablas simple basado en el diseño de la aplicación (Header azul, filas alternas).
*   **Insights**: Se definirán plantillas de texto para generar conclusiones automáticas basadas en las variaciones de los KPIs.

### 2. Servicio de Excel (xlsx-js)
*   **Estructura de Libros**:
    1.  `Resumen`: Hoja con branding, KPIs principales y variaciones.
    2.  `Datos {Nombre}`: Hoja con el detalle granular.
*   **Formateo**: Uso de estilos de celda para moneda COP (`$ #,##0`), porcentajes (`0.0%`) y fechas long.

### 3. Modelo de Datos para Exportación
Se utilizarán los tipos definidos en `types/reports.ts` (`ExecutiveReportData` y `ExcelExportData`) para desacoplar la lógica visual del dashboard de la lógica de generación del documento.

## Flujo de Datos
1.  El Componente de Reporte (ej. `DashboardGerencial`) calcula sus métricas.
2.  Al exportar, construye un objeto `ExecutiveReportData` con los insights.
3.  Llama al servicio `exportExecutivePDF(data)`.
4.  El servicio itera las secciones, captura gráficos si es necesario y compone el PDF.

## UI/UX de Selección
*   El usuario podrá elegir qué secciones incluir antes de generar el reporte (opcional, por defecto todo).
