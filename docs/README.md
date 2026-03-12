# Documentación del Sistema SLA y Dashboard de KPIs

## Índice de Documentación

### 1. Guías de Usuario

- [Guía de Usuario del Dashboard](user-guide-dashboard.md) - Manual completo para usuarios finales

### 2. Documentación Técnica

- [API Endpoints](api/kpi-endpoints.md) - Documentación de endpoints REST con ejemplos
- [Lógica de Extracción de Etapas](stage-extraction-logic.md) - Detalle técnico del sistema de extracción

### 3. Base de Datos

- Ver archivos SQL en `/migrations/`
  - `004_create_siniestro_etapas.sql` - Tabla de etapas
  - `005_add_siniestro_etapas_indexes.sql` - Índices optimizados
  - `006_create_claim_amparos_junction.sql` - Tabla de relación amparos
  - `007_create_sla_trigger.sql` - Trigger de extracción automática

### 4. Scripts de Migración

- `/scripts/migrate-sla-data.ts` - Script para migrar datos históricos

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Dashboard  │  │   KPI Cards  │  │    Filters   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Layer (REST)                           │
│  GET /api/kpis/overview                                      │
│  GET /api/kpis/lead-time                                     │
│  GET /api/kpis/tasas                                         │
│  GET /api/kpis/backlog                                       │
│  ...                                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Services Layer                              │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ KpiService       │  │ SlaTrackingService│               │
│  └──────────────────┘  └──────────────────┘               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                Database (PostgreSQL/Supabase)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    claims    │  │siniestro_    │  │   amparos    │      │
│  │              │  │   etapas     │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Componentes Principales

### Frontend

- **Dashboard**: Componente principal de visualización
- **KPICard**: Tarjetas de métricas con indicadores visuales
- **FilterSidebar**: Panel de filtros multidimensionales
- **AmparosDropdown**: Selector de amparos con multiselect
- **AmparosAdmin**: Interfaz de administración de amparos

### Backend

- **KpiService**: Cálculo de métricas y agregaciones
- **SlaTrackingService**: Extracción de fechas de observaciones
- **SlaBatchProcessor**: Procesamiento por lotes para migración

### Database

- **siniestro_etapas**: Almacena fechas de las 16 etapas
- **amparos**: Catálogo de tipos de amparos
- **claim_amparos**: Relación many-to-many entre claims y amparos

## Instalación y Configuración

### Requisitos Previos

- Node.js 18+
- PostgreSQL 14+
- Supabase CLI (opcional)

### Pasos de Instalación

1. **Clonar repositorio**

   ```bash
   git clone <repository-url>
   cd gestion_siniestros
   ```

2. **Instalar dependencias**

   ```bash
   npm install
   ```

3. **Configurar variables de entorno**

   ```bash
   cp .env.example .env
   # Editar .env con tus credenciales de Supabase
   ```

4. **Ejecutar migraciones de base de datos**

   ```bash
   # Aplicar migraciones en orden
   psql -d your_database -f migrations/004_create_siniestro_etapas.sql
   psql -d your_database -f migrations/005_add_siniestro_etapas_indexes.sql
   psql -d your_database -f migrations/006_create_claim_amparos_junction.sql
   psql -d your_database -f migrations/007_create_sla_trigger.sql
   ```

5. **Migrar datos históricos (opcional)**

   ```bash
   npx ts-node scripts/migrate-sla-data.ts
   ```

6. **Iniciar servidor de desarrollo**
   ```bash
   npm run dev
   ```

## Uso

### Acceder al Dashboard

Una vez instalado, el dashboard estará disponible en:

```
http://localhost:3000/dashboard
```

### API Endpoints

Los endpoints de la API están disponibles en:

```
http://localhost:3000/api/kpis/
```

Ver [documentación de API](api/kpi-endpoints.md) para detalles.

## KPIs Disponibles

### Indicadores Principales

1. **Ciclo de Resolución (Lead Time)**: Tiempo promedio de resolución
2. **Tasa de Desistimiento**: % de casos desistidos
3. **Tasa de Objetados**: % de casos objetados
4. **Tasa de Prescritos**: % de casos prescritos
5. **% Cerrados en Plazo**: Cumplimiento de SLA
6. **Backlog Activos**: Casos pendientes

### Filtros Soportados

- Aseguradora, Asegurado, Ramo, Vendedor
- Rango de fechas de siniestro
- Rango de valor indemnizado
- Números de siniestro (SS y Compañía)

## Mantenimiento

### Tareas Diarias

- Monitorear errores de extracción en logs
- Verificar que el trigger esté funcionando correctamente

### Tareas Semanales

- Revisar métricas de performance de queries
- Verificar cobertura de extracción por etapa

### Tareas Mensuales

- Generar reporte de extracción (migración si es necesario)
- Actualizar palabras clave si hay nuevos formatos
- Revisar y limpiar errores acumulados

## Troubleshooting

### Problemas Comunes

**Los KPIs no se actualizan**

- Verificar que el trigger `trigger_process_sla_extraction` esté activo
- Revisar logs de Supabase por errores

**Errores de extracción frecuentes**

- Revisar formato de observaciones
- Actualizar patrones regex en el servicio
- Considerar procesamiento manual para casos edge

**Performance lenta en dashboard**

- Verificar índices en tabla `siniestro_etapas`
- Considerar materialized views para KPIs frecuentes
- Implementar caching si es necesario

## Contribución

### Reportar Issues

- Usar el sistema de issues del proyecto
- Incluir pasos para reproducir
- Adjuntar logs relevantes

### Desarrollo

1. Crear branch feature: `git checkout -b feature/nombre`
2. Hacer commits descriptivos
3. Crear Pull Request con descripción detallada
4. Esperar revisión antes de mergear

## Roadmap

### Fase 1 (Completada) ✅

- [x] Extracción automática de etapas
- [x] Dashboard con KPIs principales
- [x] Sistema de filtros
- [x] Gestión de amparos

### Fase 2 (En Progreso) 🚧

- [ ] Gráficos avanzados con Recharts
- [ ] Alertas automáticas
- [ ] Reportes programados
- [ ] Integración con BI

### Fase 3 (Futuro) 📋

- [ ] Machine learning para predicción
- [ ] Mobile app
- [ ] API pública
- [ ] Multi-tenant

## Soporte

Para soporte técnico o consultas:

- Email: soporte@sgs.com
- Issues: [GitHub Issues](https://github.com/your-org/gestion_siniestros/issues)
- Documentación: Este directorio

## Licencia

[Incluir información de licencia aquí]

## Changelog

### v1.0.0 (Marzo 2024)

- Lanzamiento inicial
- Dashboard de KPIs operativo
- Sistema de extracción de etapas
- Gestión de amparos
- Documentación completa

---

**Última actualización:** Marzo 2024  
**Versión:** 1.0.0
