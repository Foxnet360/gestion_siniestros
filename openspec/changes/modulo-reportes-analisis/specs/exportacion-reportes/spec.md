## ADDED Requirements

### Requirement: Exportación a Excel con formato
El sistema DEBE permitir exportar cualquier reporte a Excel (.xlsx) con:
- Encabezados formateados (negrita, color de fondo)
- Columnas auto-ajustadas al contenido
- Formato numérico apropiado (moneda COP, porcentajes, fechas)
- Filtros automáticos en encabezados
- Congelar paneles en primera fila

#### Scenario: Usuario exporta dashboard a Excel
- **WHEN** un usuario hace clic en "Exportar Excel"
- **THEN** el sistema genera archivo .xlsx formateado profesionalmente
- **AND** mantiene los filtros aplicados en el reporte

### Requirement: Exportación a PDF tipo informe ejecutivo
El sistema DEBE permitir exportar reportes a PDF como informes ejecutivos con:
- Portada con título del reporte, fecha y logo
- Índice de secciones
- KPIs destacados en tarjetas visuales
- Gráficos integrados en alta calidad
- Tablas formateadas
- Numeración de páginas
- Encabezado/pie de página

#### Scenario: Usuario genera informe ejecutivo PDF
- **WHEN** un usuario selecciona "Exportar PDF"
- **THEN** el sistema genera documento PDF profesional de 2-5 páginas
- **AND** incluye todos los elementos visuales del reporte

### Requirement: Exportación de dashboards completos
El sistema DEBE permitir exportar dashboards completos (con gráficos) tanto a Excel como PDF.

#### Scenario: Exportación de dashboard con gráficos
- **WHEN** un usuario exporta un dashboard que contiene gráficos
- **THEN** el Excel incluye gráficos incrustados (imágenes) o hojas de gráficos
- **AND** el PDF incluye capturas de los gráficos en alta calidad

### Requirement: Opciones de exportación configurables
El sistema DEBE permitir configurar qué incluir en la exportación:
- Selección de secciones a incluir
- Rango de fechas específico para exportación
- Incluir/excluir gráficos
- Formato de números (separadores de miles, decimales)

#### Scenario: Usuario configura exportación
- **WHEN** un usuario hace clic en "Opciones de exportación"
- **THEN** el sistema muestra diálogo de configuración
- **AND** aplica las opciones seleccionadas a la exportación

### Requirement: Descarga inmediata
Las exportaciones DEBEN generarse y descargarse en menos de 5 segundos para datasets típicos (<10,000 registros).

#### Scenario: Exportación de reporte grande
- **WHEN** un usuario exporta un reporte con 5000+ registros
- **THEN** el sistema procesa y descarga en menos de 5 segundos
- **AND** muestra indicador de progreso si es necesario

### Requirement: Nombres de archivo descriptivos
Los archivos exportados DEBEN tener nombres descriptivos:
- Formato: `Reporte_{Tipo}_{FechaInicio}_{FechaFin}.{ext}`
- Ejemplo: `Reporte_DashboardGerencial_2024-01-01_2024-01-31.pdf`

#### Scenario: Descarga con nombre apropiado
- **WHEN** un usuario descarga un archivo exportado
- **THEN** el nombre del archivo incluye tipo de reporte y rango de fechas
