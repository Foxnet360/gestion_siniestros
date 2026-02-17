# Documentación de KPIs - Módulo de Reportes

## KPIs Financieros

### 1. Total Reclamado
**Fórmula:** `SUM(monto_reclamo)`  
**Descripción:** Suma total de los montos reclamados por todos los siniestros en el periodo seleccionado.  
**Unidad:** Moneda COP  
**Interpretación:** Indica el volumen total de reclamaciones recibidas.

### 2. Total Indemnizado
**Fórmula:** `SUM(valor_indemnizacion) WHERE finalizado = true`  
**Descripción:** Suma total de los valores indemnizados por siniestros cerrados.  
**Unidad:** Moneda COP  
**Interpretación:** Representa el monto total pagado a asegurados.

### 3. % Recuperación
**Fórmula:** `(Total Indemnizado / Total Reclamado) × 100`  
**Descripción:** Porcentaje del monto reclamado que fue efectivamente indemnizado.  
**Unidad:** Porcentaje (%)  
**Interpretación:** 
- > 90%: Excelente tasa de recuperación
- 70-90%: Tasa aceptable
- < 70%: Revisar rechazos y objeciones

### 4. Valor Promedio por Siniestro
**Fórmula:** `Total Reclamado / COUNT(siniestros)`  
**Descripción:** Monto promedio de reclamación por siniestro.  
**Unidad:** Moneda COP  
**Interpretación:** Útil para identificar tendencias en el valor de las reclamaciones.

### 5. Monto en Riesgo por Prescripción
**Fórmula:** `SUM(monto_reclamo) WHERE dias_restantes < 30`  
**Descripción:** Suma de montos de siniestros próximos a prescribir (< 30 días).  
**Unidad:** Moneda COP  
**Interpretación:** Indica el valor monetario en riesgo de perderse por prescripción.

---

## KPIs Operativos

### 1. Total Siniestros Activos
**Fórmula:** `COUNT(*) WHERE finalizado = false`  
**Descripción:** Número de siniestros que aún no han sido cerrados.  
**Unidad:** Conteo  
**Interpretación:** Volumen de trabajo pendiente en la cartera.

### 2. Total Siniestros Cerrados
**Fórmula:** `COUNT(*) WHERE finalizado = true`  
**Descripción:** Número de siniestros cerrados en el periodo.  
**Unidad:** Conteo  
**Interpretación:** Productividad del equipo en términos de cierres.

### 3. % Cerrados dentro del Plazo
**Fórmula:** `(COUNT(cerrados_en_plazo) / Total Cerrados) × 100`  
**Donde:** `cerrados_en_plazo = fecha_cierre - fecha_aviso <= 45 días`  
**Descripción:** Porcentaje de siniestros cerrados dentro del tiempo objetivo (45 días).  
**Unidad:** Porcentaje (%)  
**Interpretación:**
- > 80%: Excelente eficiencia
- 60-80%: Eficiencia aceptable
- < 60%: Revisar procesos

### 4. Tiempo Promedio Total
**Fórmula:** `AVG(fecha_finalizacion - fecha_aviso)`  
**Descripción:** Tiempo promedio desde el aviso hasta el cierre/pago.  
**Unidad:** Días  
**Interpretación:**
- < 30 días: Excelente
- 30-45 días: Bueno
- 45-60 días: Regular
- > 60 días: Revisar cuellos de botella

### 5. % Siniestros con Objeción
**Fórmula:** `(COUNT(*) WHERE estado = 'OBJECIÓN' / Total Siniestros) × 100`  
**Descripción:** Porcentaje de siniestros que han sido objetados.  
**Unidad:** Porcentaje (%)  
**Interpretación:** Alto porcentaje puede indicar problemas en documentación inicial.

---

## Métricas de Prescripción

### Niveles de Riesgo

#### 🔴 Alto Riesgo
- **Criterio:** Menos de 30 días para prescribir
- **Acción:** Prioridad máxima, gestión inmediata

#### 🟡 Riesgo Medio
- **Criterio:** Entre 30 y 60 días para prescribir
- **Acción:** Seguimiento activo

#### 🟢 Bajo Riesgo
- **Criterio:** Más de 60 días para prescribir
- **Acción:** Monitoreo estándar

---

## Cálculo de Tiempos por Fase

El tiempo por fase se calcula sumando la duración en cada estado del workflow:

```
Tiempo_Fase = SUM(days_duration) 
WHERE state IN (estados_de_la_fase)
```

### Fases del Workflow

1. **Fase 1:** AVISO - SOPORTES - ESTUDIO
2. **Fase 2:** RADICACIÓN - AJUSTE
3. **Fase 3:** LIQUIDACIÓN - OBJECIÓN
4. **Fase 4:** RECONSIDERACIÓN
5. **Fase 5:** RATIFICACIÓN
6. **Fase 6:** JURÍDICO - PRESCRIPCIÓN
7. **Fase 7:** PAGO - FINALIZADO

### Identificación de Cuellos de Botella

Una fase se considera cuello de botella cuando:
- Acumula > 20% de los casos activos
- Tiempo promedio > 15 días
- Mayor tiempo respecto a otras fases

---

## Comparativos

### Mes vs Mes
Compara métricas del mes actual contra el mes anterior inmediato.

### Año vs Año
Compara métricas acumuladas del año actual contra el año anterior.

### Ranking de Aseguradoras
Ordena aseguradoras por:
- Menor tiempo promedio de respuesta
- Menor porcentaje de objeciones
- Mayor tasa de cierre exitoso

### Variación (%)
```
Variación = ((Valor_Actual - Valor_Anterior) / Valor_Anterior) × 100
```

**Indicadores:**
- ↑ Verde: Mejora vs periodo anterior
- ↓ Rojo: Deterioro vs periodo anterior
- → Gris: Sin cambio significativo (< 1%)

---

## Filtros y Segmentación

Todos los KPIs pueden filtrarse por:
- **Rango de fechas:** Personalizado o predefinido
- **Ramo:** Autos, Vida, Hogar, etc.
- **Aseguradora:** Por compañía específica
- **Técnico:** Por responsable asignado

La aplicación de filtros recalcula automáticamente todos los indicadores.

---

## Actualización de Datos

- **Frecuencia:** En tiempo real
- **Fuente:** Base de datos Supabase
- **Cache:** useMemo para optimización de rendimiento

---

## Notas Técnicas

### Cálculo de Días
```typescript
const dias = Math.floor(
  (fecha_fin.getTime() - fecha_inicio.getTime()) / (1000 * 60 * 60 * 24)
);
```

### Formato de Moneda
- **Moneda:** COP (Peso Colombiano)
- **Formato:** $ 15.000.000
- **Separador de miles:** Punto (.)
- **Sin decimales:** Redondeo a enteros

### Formato de Porcentajes
- **Decimales:** 1 decimal
- **Símbolo:** %
- **Ejemplo:** 85.5%
