# Guía de Usuario - Dashboard de KPIs

## Índice

1. [Introducción](#introducción)
2. [Acceso al Dashboard](#acceso-al-dashboard)
3. [KPIs Principales](#kpis-principales)
4. [Filtros](#filtros)
5. [Visualización de Datos](#visualización-de-datos)
6. [Exportación](#exportación)
7. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## Introducción

El Dashboard de KPIs del Sistema de Gestión de Siniestros (SGS) proporciona una visión integral del rendimiento operativo mediante métricas clave que permiten:

- Monitorear tiempos de resolución
- Identificar cuellos de botella
- Medir tasas de éxito/fracaso
- Gestionar el backlog de casos

---

## Acceso al Dashboard

### Requisitos

- Tener una cuenta activa en el sistema SGS
- Permisos de visualización de KPIs (rol: Administrador o Analista)

### Navegación

1. Inicie sesión en el sistema SGS
2. En el menú principal, seleccione **"Dashboard"** > **"KPIs"**
3. El dashboard cargará automáticamente con los datos del mes actual

---

## KPIs Principales

### 1. Ciclo de Resolución (Lead Time)

**Descripción:** Tiempo promedio en días hábiles desde el aviso del siniestro hasta su finalización.

**Meta:** ≤ 30 días hábiles

**Interpretación:**

- 🟢 **Verde:** Lead time ≤ 30 días (meta cumplida)
- 🔴 **Rojo:** Lead time > 30 días (meta no cumplida)

**Acción recomendada:** Si el lead time es alto, revise el backlog por etapas para identificar dónde se acumulan los casos.

---

### 2. Tasa de Desistimiento

**Descripción:** Porcentaje de siniestros que fueron desistidos por el asegurado.

**Meta:** < 10%

**Interpretación:**

- 🟢 **Verde:** Tasa < 10% (aceptable)
- 🔴 **Rojo:** Tasa ≥ 10% (requiere atención)

**Acción recomendada:** Una tasa alta puede indicar problemas en la comunicación con el asegurado o demoras excesivas.

---

### 3. Tasa de Objetados

**Descripción:** Porcentaje de siniestros objetados por la compañía aseguradora.

**Interpretación:** Monitorear tendencias. Un aumento repentino puede indicar problemas en la documentación inicial.

---

### 4. Tasa de Prescritos

**Descripción:** Porcentaje de siniestros prescritos (fuera de término legal).

**Nota legal:**

- Prescripción ordinaria: 2 años desde conocimiento del siniestro
- Prescripción extraordinaria: 5 años si no hubo conocimiento

**Acción recomendada:** Casos prescritos deben revisarse legalmente antes de cerrar.

---

### 5. % Cerrados en Plazo (SLA)

**Descripción:** Porcentaje de siniestros cerrados dentro del plazo establecido.

**Meta:** ≤ 19%

**Interpretación:** Indica el cumplimiento de los Service Level Agreements con las aseguradoras.

---

### 6. Backlog de Siniestros Activos

**Descripción:** Número total de siniestros que aún no han sido finalizados.

**Importancia:** Indicador de carga de trabajo actual del equipo.

---

## Filtros

El dashboard permite filtrar datos por múltiples dimensiones:

### Filtros Disponibles

| Filtro                    | Descripción                       | Ejemplo                  |
| ------------------------- | --------------------------------- | ------------------------ |
| **Aseguradora**           | Nombre de la compañía aseguradora | Seguros ABC              |
| **Asegurado**             | Nombre del asegurado              | Juan Pérez               |
| **Ramo**                  | Línea de negocio                  | Autos, Hogar, Vida       |
| **Vendedor**              | Nombre del vendedor               | María García             |
| **Fecha de Siniestro**    | Rango de fechas                   | 01/01/2024 - 31/12/2024  |
| **Valor Indemnizado**     | Rango de valores                  | $1,000,000 - $50,000,000 |
| **N° Siniestro SS**       | Número en sistema SS              | SS-2024-001              |
| **N° Siniestro Compañía** | Número asignado por aseguradora   | POL-123456               |

### Cómo Aplicar Filtros

1. En la barra lateral izquierda, seleccione los filtros deseados
2. Ingrese los valores en los campos correspondientes
3. Haga clic en **"Aplicar Filtros"**
4. Los KPIs se actualizarán automáticamente

### Combinación de Filtros

Los filtros se aplican con operador **AND** (todos deben cumplirse). Por ejemplo:

- Aseguradora = "ABC" AND Ramo = "Autos"
- Mostrará solo siniestros de Autos de la aseguradora ABC

### Limpiar Filtros

Haga clic en **"Limpiar Filtros"** para restablecer todos los valores y ver los datos sin filtros.

---

## Visualización de Datos

### Lead Time Detallado

Muestra estadísticas adicionales del tiempo de resolución:

- **Promedio:** Tiempo medio de resolución
- **Percentiles:** P50, P75, P90, P95
  - P50: 50% de los casos se resuelven en menos de X días
  - P95: 95% de los casos se resuelven en menos de X días

### Backlog por Antigüedad

Visualiza la distribución de casos abiertos según su tiempo de permanencia:

- 0-30 días: Casos recientes
- 31-60 días: Casos moderados
- 61-90 días: Casos que requieren atención
- 90+ días: Casos críticos (revisar prioritariamente)

### Backlog por Etapa

Muestra en qué etapa del proceso se encuentran los casos abiertos, permitiendo identificar cuellos de botella específicos.

---

## Exportación

### Exportar a CSV

1. Haga clic en el botón **"Exportar CSV"** en la esquina superior derecha
2. El archivo se descargará automáticamente con el formato: `kpi-report-YYYY-MM-DD.csv`
3. El archivo incluye:
   - Indicadores principales
   - Lead time detallado
   - Tasas con conteos
   - Backlog desagregado

### Formato del Archivo

El archivo CSV utiliza codificación UTF-8 y separador de comas. Es compatible con:

- Microsoft Excel
- Google Sheets
- LibreOffice Calc
- Cualquier software de hojas de cálculo

---

## Preguntas Frecuentes

### ¿Con qué frecuencia se actualizan los datos?

Los datos se actualizan en tiempo real. Cada vez que se modifica un siniestro, los KPIs se recalculan automáticamente.

### ¿Puedo guardar mis filtros favoritos?

Actualmente no es posible guardar filtros predefinidos. Debe aplicarlos manualmente cada vez que accede al dashboard.

### ¿Qué significa cuando un KPI está en gris?

Indica que no hay datos disponibles para ese indicador con los filtros aplicados, o que aún no se ha definido una meta.

### ¿Cómo interpreto los percentiles del Lead Time?

- **P50 (Mediana):** El 50% de los siniestros se resuelven más rápido que este valor
- **P95:** El 95% de los siniestros se resuelven más rápido que este valor (útil para identificar casos atípicos)

### ¿Puedo comparar períodos diferentes?

Actualmente el dashboard muestra datos del período filtrado. Para comparar períodos, exporte los datos de cada período y comparelos externamente.

### ¿Qué hago si veo un error en los datos?

1. Verifique que los filtros aplicados sean correctos
2. Refresque la página (F5)
3. Si el error persiste, contacte al administrador del sistema

### ¿Es posible ver datos de un siniestro específico?

Sí, use el filtro "N° Siniestro SS" o "N° Siniestro Compañía" para ver KPIs de un caso específico.

---

## Soporte

Para reportar problemas o solicitar nuevas funcionalidades:

- **Email:** soporte@sgs.com
- **Teléfono:** +57 (1) 123-4567
- **Horario:** Lunes a Viernes, 8:00 AM - 6:00 PM

---

## Versión

- **Versión del Documento:** 1.0
- **Fecha:** Marzo 2024
- **Sistema:** SGS - Sistema de Gestión de Siniestros
