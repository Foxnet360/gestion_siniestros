## 1. Setup y Dependencias

- [x] 1.1 Instalar dependencias: `npm install chart.js react-chartjs-2 jspdf html2canvas`
- [x] 1.2 Crear estructura de carpetas `components/Reports/` con subcarpetas
- [x] 1.3 Crear tipos TypeScript para reportes (`types/reports.ts`)
- [x] 1.4 Configurar Chart.js con tema oscuro (colores slate/blue)
- [x] 1.5 Crear constantes de configuración (metas, días estancado, colores)

## 2. Componentes Base y Layout

- [x] 2.1 Crear `ReportsPage.tsx` - Página principal con selector de reportes
- [x] 2.2 Crear `ReportLayout.tsx` - Layout común con encabezado
- [x] 2.3 Crear `ReportFilters.tsx` - Componente de filtros dinámicos
- [x] 2.4 Crear `ExportButtons.tsx` - Botones Excel/PDF con opciones
- [x] 2.5 Agregar guard de acceso por rol (ADMIN only)
- [x] 2.6 Integrar enrutamiento desde Sidebar

## 3. Hooks de Métricas

- [x] 3.1 Crear `useKpiFinancieros.ts` - Cálculo de KPIs financieros
- [x] 3.2 Crear `useKpiOperativos.ts` - Cálculo de KPIs operativos
- [x] 3.3 Crear `useTiemposPromedio.ts` - Tiempos Aviso→Pago
- [x] 3.4 Crear `useTiemposPorFase.ts` - Cálculo usando state_history
- [x] 3.5 Crear `usePrescripcionRiesgo.ts` - Clasificación 🔴🟡🟢
- [x] 3.6 Crear `useProductividadTecnico.ts` - Métricas por técnico
- [x] 3.7 Crear `useComparativos.ts` - Comparativos mes/año
- [x] 3.8 Crear `useCasosEstancados.ts` - Detección de casos quietos

## 4. Dashboard Gerencial (FASE 1)

- [x] 4.1 Crear `DashboardGerencial.tsx` - Contenedor principal
- [x] 4.2 Crear `KpiFinancieros.tsx` - Grid de 5 KPIs financieros
- [x] 4.3 Crear `KpiOperativos.tsx` - Grid de 5 KPIs operativos
- [x] 4.4 Crear `TrendCharts.tsx` - Gráficos de tendencia (bar/line)
- [x] 4.5 Crear indicadores de variación (↑↓) vs periodo anterior
- [x] 4.6 Implementar filtros dinámicos con recálculo automático
- [x] 4.7 Testing de carga <3 segundos

## 5. Reporte Crítico de Prescripción (FASE 1)

- [x] 5.1 Crear `ReportePrescripcion.tsx` - Contenedor
- [x] 5.2 Crear `RiesgoBadge.tsx` - Componente visual 🔴🟡🟢
- [x] 5.3 Crear `TablaPrescripcion.tsx` - Tabla con campos obligatorios
- [x] 5.4 Implementar ordenamiento automático por días restantes
- [x] 5.5 Implementar filtros específicos (riesgo, compañía, etc.)
- [x] 5.6 Agregar acciones: ver detalle, asignar prioridad
- [x] 5.7 Calcular días sin movimiento desde lastStateChangeDate

## 6. Dashboard Operativo (FASE 2)

- [x] 6.1 Crear `DashboardOperativo.tsx` - Contenedor
- [x] 6.2 Crear `ProductividadTecnicos.tsx` - Tabla comparativa
- [x] 6.3 Crear ranking de técnicos por eficiencia
- [x] 6.4 Crear `CasosEstancados.tsx` - Lista con filtro configurable
- [x] 6.5 Implementar detección de cuellos de botella por fase
- [x] 6.6 Crear alertas visuales para casos críticos
- [x] 6.7 Agregar vista de detalle por técnico

## 7. Métricas de Tiempo (FASE 2)

- [x] 7.1 Crear `MetricasTiempo.tsx` - Contenedor
- [x] 7.2 Crear `TiemposPorFase.tsx` - Gráfico de barras por fase
- [x] 7.3 Implementar desglose por aseguradora/ramo/técnico
- [x] 7.4 Implementar benchmarking vs meta configurada
- [x] 7.5 Crear visualización de tendencias temporales
- [x] 7.6 Agregar alertas de desviación de meta

## 8. Análisis Comparativo (FASE 2)

- [x] 8.1 Crear `AnalisisComparativo.tsx` - Contenedor
- [x] 8.2 Implementar comparativo Mes vs Mes
- [x] 8.3 Implementar comparativo Año vs Año
- [x] 8.4 Crear comparativo por Aseguradora (ranking)
- [x] 8.5 Crear comparativo por Ramo
- [x] 8.6 Implementar rankings Top/Bottom 5
- [x] 8.7 Crear visualización de tendencias históricas

## 9. Exportación Excel (FASE 3)

- [x] 9.1 Crear `excelExport.ts` - Servicio de exportación
- [x] 9.2 Implementar formato profesional (encabezados, colores, anchos)
- [x] 9.3 Agregar filtros automáticos en Excel
- [x] 9.4 Formatear números (moneda COP, porcentajes, fechas)
- [x] 9.5 Implementar exportación de dashboards con gráficos (imágenes)
- [x] 9.6 Generar nombres de archivo descriptivos
- [x] 9.7 Testing con 5000+ registros (<5 segundos)

## 10. Exportación PDF (FASE 3)

- [x] 10.1 Crear `pdfExport.ts` - Servicio de exportación PDF
- [x] 10.2 Crear componentes "print-friendly" para cada reporte
- [x] 10.3 Implementar captura de gráficos Chart.js con html2canvas
- [x] 10.4 Crear portada con título, fecha y logo
- [x] 10.5 Agregar encabezado/pie de página con numeración
- [x] 10.6 Implementar opciones configurables de exportación
- [x] 10.7 Testing de calidad visual y tiempos

## 11. Integración y Testing

- [x] 11.1 Integrar todos los reportes en `ReportsPage`
- [x] 11.2 Agregar transiciones suaves entre reportes
- [x] 11.3 Testing de filtros combinados
- [x] 11.4 Testing de cálculos de métricas (validar fórmulas)
- [x] 11.5 Testing de permisos de acceso
- [x] 11.6 Testing de exportaciones (Excel/PDF)
- [x] 11.7 Optimización de performance (useMemo, lazy loading)

## 12. Documentación y Entrega

- [x] 12.1 Crear documentación de KPIs y fórmulas (`docs/kpis.md`)
- [x] 12.2 Documentar cómo usar cada reporte
- [x] 12.3 Crear guía de interpretación de métricas
- [x] 12.4 Limpiar console.logs y código de debugging
- [x] 12.5 Verificar linting y type checking
- [x] 12.6 Preparar demo para usuarios clave
