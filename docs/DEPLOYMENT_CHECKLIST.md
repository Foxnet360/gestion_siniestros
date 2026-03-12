# Checklist de Deployment - KPI Eficiencia por Etapas

## Pre-Deployment

- [ ] Ejecutar script DDL: `scripts/kpi_eficiencia_etapas_ddl.sql`
- [ ] Verificar que todas las tablas se crearon correctamente
- [ ] Confirmar que los índices fueron creados
- [ ] Validar datos iniciales en `sla_por_etapa` y `feriados_colombia`

## Procesamiento de Datos

- [ ] Ejecutar script batch en modo test (100 siniestros)
- [ ] Verificar logs de procesamiento
- [ ] Validar calidad: % de exclusiones < 30%
- [ ] Ejecutar procesamiento completo de histórico
- [ ] Confirmar que `metricas_etapas` tiene datos

## Frontend

- [ ] Agregar ruta `/dashboard/eficiencia-etapas` al router
- [ ] Agregar enlace en navegación principal
- [ ] Verificar que los componentes se cargan correctamente
- [ ] Probar filtros funcionan
- [ ] Confirmar exportación CSV funciona

## Testing

- [ ] Ejecutar tests unitarios: `npm test -- MetricasEtapasService.test.ts`
- [ ] Validar cálculos con muestra de 10 siniestros
- [ ] Verificar P90 se calcula correctamente
- [ ] Confirmar exclusión de siniestros sin etapa 1 o 16
- [ ] Probar endpoints API con Postman/curl

## Seguridad y Performance

- [ ] Verificar que solo usuarios autorizados acceden al dashboard
- [ ] Confirmar caché funciona (TTL 5 minutos)
- [ ] Probar con volumen de datos real
- [ ] Verificar tiempos de respuesta API < 2 segundos

## Backup

- [ ] Crear backup de base de datos antes del deploy
- [ ] Verificar estrategia de backups para nuevas tablas
- [ ] Documentar procedimiento de rollback

## Post-Deployment

- [ ] Monitorear errores en logs
- [ ] Verificar métricas se calculan para nuevos siniestros
- [ ] Configurar job periódico para procesamiento (diario/semanal)
- [ ] Comunicar a usuarios la nueva funcionalidad
- [ ] Recopilar feedback de usuarios

## Monitoreo Continuo

- [ ] Revisar % de exclusiones semanalmente
- [ ] Monitorear performance del dashboard
- [ ] Verificar calidad de datos
- [ ] Revisar cuellos de botella identificados

## Rollback

En caso de problemas:

1. Deshabilitar enlace a dashboard
2. Restaurar backup de base de datos si es necesario
3. Los datos procesados se mantienen para análisis posterior
4. No hay breaking changes en el sistema existente

## Contacto

- Desarrollo: [Tu nombre]
- DevOps: [DevOps nombre]
- Producto: [Producto nombre]

## Fecha de Deploy

Fecha planificada: ****\_\_\_****
Fecha real: ****\_\_\_****
Versión: 1.0.0
