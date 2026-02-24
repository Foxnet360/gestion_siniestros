# Proposal: Reportes Ejecutivos Premium y Exportación Avanzada

## Contexto
El sistema cuenta actualmente con un módulo de reportes funcional, pero las capacidades de exportación son básicas. El usuario requiere informes que puedan ser presentados a nivel gerencial, con un diseño moderno, profesional y que aporten valor analítico (insights) más allá de los datos crudos.

## Objetivos
1.  **Exportación Excel Profesional**: Mejorar el formato de los archivos Excel para que incluyan branding, una hoja de resumen ejecutivo y formatos de celda adecuados (moneda, porcentajes).
2.  **Informe Ejecutivo PDF**: Transformar la exportación PDF de una simple captura de pantalla a un documento estructurado con portada, análisis detallado de gráficos, tablas de datos y conclusiones automáticas.
3.  **Consistencia Visual**: Aplicar una estética "premium" coherente con el resto de la aplicación en todas las piezas exportadas.

## Alcance
*   Refactorización del servicio `excelExport.ts`.
*   Refactorización del servicio `pdfExport.ts`.
*   Actualización de los componentes de reporte para soportar el envío de datos estructurados para exportación:
    *   Dashboard Gerencial
    *   Reporte de Prescripción
    *   Dashboard Operativo
    *   Métricas de Tiempo
    *   Análisis Comparativo

## Valor de Negocio
*   Facilita la toma de decisiones estratégicas mediante informes listos para presentar.
*   Ahorra tiempo al equipo operativo al automatizar la generación de resúmenes financieros.
*   Refuerza la imagen de marca y profesionalismo del sistema Foxnet360.
