# Tasks: Implementación de Reportes Ejecutivos

## Fase 1: Servicios Core de Exportación

- [x] 1.1 Refactorizar `pdfExport.ts` para soportar informe ejecutivo (portada, secciones, insights)
- [x] 1.2 Refactorizar `excelExport.ts` para soportar hoja de resumen y formatos premium
- [x] 1.3 Implementar utilidades de formateo para PDF (tablas, encabezados)

## Fase 2: Integración en Dashboards (Dashboard Gerencial)

- [x] 2.1 Preparar datos estructurados en `DashboardGerencial.tsx`
- [x] 2.2 Actualizar handler de exportación PDF con insights automáticos
- [x] 2.3 Actualizar handler de exportación Excel con hoja de resumen

## Fase 3: Integración en Resto de Reportes

- [x] 3.1 Actualizar `ReportePrescripcion.tsx`
- [x] 3.2 Actualizar `DashboardOperativo.tsx`
- [x] 3.3 Actualizar `MetricasTiempo.tsx`
- [x] 3.4 Actualizar `AnalisisComparativo.tsx`

## Fase 4: Polishing y Branding

- [x] 4.1 Incluir logo en cabeceras de exportación
- [x] 4.2 Ajustar paleta de colores final para concordancia con el tema oscuro/claro
- [x] 4.3 Testing final de exportaciones con grandes volúmenes de datos
