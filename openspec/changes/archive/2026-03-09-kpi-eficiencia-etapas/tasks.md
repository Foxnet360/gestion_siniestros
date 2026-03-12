## 1. Base de Datos - DDL

- [x] 1.1 Crear tabla `sla_por_etapa` con definiciones de SLAs para 16 etapas
- [x] 1.2 Crear tabla `metricas_etapas` con campos de tiempo, seguimiento y segmentación
- [x] 1.3 Crear tabla `seguimientos_procesados` para almacenar tracking de observaciones
- [x] 1.4 Crear tabla `kpis_etapas_agregados` para caché de métricas calculadas
- [x] 1.5 Crear tabla `feriados_colombia` con feriados 2024-2025
- [x] 1.6 Crear índices en tablas nuevas (claim_id, etapa_num, tipo_proceso, datos_completos)
- [x] 1.7 Poblar `sla_por_etapa` con datos iniciales (SLA y frecuencia por etapa)
- [x] 1.8 Poblar `feriados_colombia` con feriados nacionales 2024-2025

## 2. Servicios Core - Cálculo de Métricas

- [x] 2.1 Crear `MetricasEtapasService.ts` con estructura base
- [x] 2.2 Implementar `calcularDiasHabiles()` excluyendo fines de semana
- [x] 2.3 Implementar validación de feriados colombianos en cálculo de días
- [x] 2.4 Implementar `validarCompletitudDatos()` - verificar etapa 1 y 16
- [x] 2.5 Implementar `calcularFrecuenciaSeguimiento()` usando claim_history
- [x] 2.6 Implementar `clasificarTipoProceso()` - normal/prescripcion_ord/prescripcion_ext
- [x] 2.7 Implementar `calcularMetricasPorEtapa()` para una etapa individual
- [x] 2.8 Implementar `calcularMetricasSiniestro()` procesando todas las etapas
- [x] 2.9 Implementar `evaluarCumplimientoSLA()` comparando tiempo vs SLA definido
- [x] 2.10 Implementar guardado en `metricas_etapas` con manejo de duplicados

## 3. Procesamiento Batch Histórico

- [x] 3.1 Crear script `procesar-metricas-historicas.ts` batch
- [x] 3.2 Implementar procesamiento en lotes de 100 siniestros
- [x] 3.3 Agregar logging de progreso (X de Y procesados)
- [x] 3.4 Implementar manejo de errores por siniestro (no fallar todo el batch)
- [x] 3.5 Agregar resumen final: total, éxitos, fallos, exclusiones
- [x] 3.6 Probar script con muestra de 100 siniestros
- [x] 3.7 Ejecutar procesamiento completo de histórico
- [x] 3.8 Validar calidad: verificar % de exclusiones < 30%

## 4. API Endpoints

- [x] 4.1 Crear endpoint `GET /api/kpis/eficiencia-etapas` base
- [x] 4.2 Implementar parámetros de filtro: aseguradora, ramo, tecnico, tipoProceso
- [x] 4.3 Implementar cálculo de percentiles (P50, P90) por etapa
- [x] 4.4 Implementar identificación de cuellos de botella
- [x] 4.5 Implementar endpoint `GET /api/kpis/eficiencia-etapas/funnel`
- [x] 4.6 Implementar endpoint `GET /api/kpis/eficiencia-etapas/segmentacion`
- [x] 4.7 Implementar endpoint `GET /api/kpis/eficiencia-etapas/calidad-datos`
- [x] 4.8 Agregar caché de respuestas (TTL 5 minutos)
- [x] 4.9 Implementar paginación para grandes volúmenes
- [x] 4.10 Agregar manejo de errores y status codes apropiados

## 5. Frontend - Componentes Base

- [x] 5.1 Crear página/ruta `/dashboard/eficiencia-etapas`
- [x] 5.2 Crear hook `useEficienciaEtapas()` para consumir API
- [x] 5.3 Crear hook `useFiltrosEficiencia()` para manejo de filtros
- [x] 5.4 Implementar loader/skeleton para estados de carga
- [x] 5.5 Implementar manejo de errores en UI
- [x] 5.6 Crear componente `IndicadorCalidadDatos` mostrando incluidos/excluidos

## 6. Frontend - Visualizaciones

- [x] 6.1 Crear componente `FunnelEtapas` con gráfico de embudo
- [x] 6.2 Implementar colores según conversión (rojo <70%, amarillo 70-90%, verde >90%)
- [x] 6.3 Crear componente `TiemposPorEtapa` (gráfico de barras comparando vs SLA)
- [x] 6.4 Implementar toggle entre promedio y P90
- [x] 6.5 Crear componente `CuellosDeBotella` mostrando etapas problemáticas
- [x] 6.6 Crear componente `LeadTimePorTipoProceso` (3 tarjetas comparativas)
- [x] 6.7 Crear componente `TendenciaTemporal` (gráfico de línea mensual)
- [x] 6.8 Implementar tooltips informativos en todos los gráficos

## 7. Frontend - Filtros y Segmentación

- [x] 7.1 Crear componente `FiltrosEficiencia` con dropdowns
- [x] 7.2 Implementar filtro por tipo de proceso (Normal/Prescripción)
- [x] 7.3 Implementar filtro por aseguradora (dropdown dinámico desde API)
- [x] 7.4 Implementar filtro por ramo (dropdown dinámico)
- [x] 7.5 Implementar filtro por técnico (dropdown con búsqueda)
- [x] 7.6 Implementar filtro por rango de fechas
- [x] 7.7 Implementar aplicación de filtros con debounce
- [x] 7.8 Implementar botón "Limpiar filtros"
- [x] 7.9 Mostrar filtros activos como chips/badges
- [x] 7.10 Implementar guardar/cargar vistas personalizadas (localStorage)
- [x] 8.1 Crear componente `TablaMetricasPorEtapa` con datos detallados
- [x] 8.2 Implementar ordenamiento por columnas (tiempo, SLA, cumplimiento)
- [x] 8.3 Crear componente `TablaSiniestrosExcluidos` con razones
- [x] 8.4 Implementar paginación en tablas
- [x] 8.5 Implementar exportar a CSV (métricas y excluidos)
- [x] 8.6 Crear modal `DetalleSiniestro` mostrando línea de tiempo
- [x] 8.7 Implementar navegación desde gráficos a detalles (drill-down)

## 9. Testing

- [x] 9.1 Escribir tests unitarios para `calcularDiasHabiles()`
- [x] 9.2 Escribir tests para validación de feriados
- [x] 9.3 Escribir tests para `clasificarTipoProceso()`
- [x] 9.4 Escribir tests para cálculo de frecuencia
- [x] 9.5 Escribir tests de integración para endpoints API
- [x] 9.6 Validar cálculos con muestra de 10 siniestros manuales
- [x] 9.7 Verificar que P90 se calcula correctamente (no promedio)
- [x] 9.8 Verificar exclusión de siniestros sin etapa 1 o 16

## 10. Documentación y Deployment

- [x] 10.1 Actualizar README con instrucciones de procesamiento batch
- [x] 10.2 Documentar esquema de SLAs por etapa
- [x] 10.3 Crear guía de usuario para dashboard (screenshots)
- [x] 10.4 Agregar enlace al dashboard en navegación principal
- [x] 10.5 Configurar job periódico para procesar nuevos siniestros (daily/weekly)
- [x] 10.6 Verificar backups de nuevas tablas
- [x] 10.7 Comunicar a usuarios la nueva funcionalidad
- [x] 10.8 Monitorear performance post-deployment
