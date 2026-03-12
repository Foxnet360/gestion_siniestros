# Documentación - Lógica de Extracción de Etapas

## Índice

1. [Visión General](#visión-general)
2. [Etapas del Proceso](#etapas-del-proceso)
3. [Lógica de Extracción](#lógica-de-extracción)
4. [Formatos de Fecha Soportados](#formatos-de-fecha-soportados)
5. [Palabras Clave por Etapa](#palabras-clave-por-etapa)
6. [Validaciones](#validaciones)
7. [Manejo de Errores](#manejo-de-errores)
8. [Triggers de Base de Datos](#triggers-de-base-de-datos)

---

## Visión General

El sistema extrae automáticamente las fechas de 16 etapas clave del proceso de siniestros desde:

1. **Campos del sistema SS** (Etapas 1-2)
2. **Campo observaciones** (Etapas 3-16)

La extracción ocurre:

- En tiempo real: Cuando se inserta o actualiza un siniestro
- Por lotes: Mediante scripts de migración para datos históricos

---

## Etapas del Proceso

| Etapa | Nombre                      | Origen                                 | Descripción                         |
| ----- | --------------------------- | -------------------------------------- | ----------------------------------- |
| 1     | Aviso Siniestro             | Campo `fecha_aviso`                    | Fecha de registro del aviso         |
| 2     | Radicación Compañía         | Campo `fecha_notificacion_aseguradora` | Fecha de notificación a aseguradora |
| 3     | Ajustador                   | Observaciones                          | Asignación de ajustador             |
| 4     | Documentos Adicionales      | Observaciones                          | Solicitud de documentos extra       |
| 5     | Asistencia                  | Observaciones                          | Servicios de asistencia             |
| 6     | Liquidación                 | Observaciones                          | Propuesta de liquidación            |
| 7     | Objeción                    | Observaciones                          | Objeción de la compañía             |
| 8     | Reconsideración Liquidación | Observaciones                          | Reconsideración de liquidación      |
| 9     | Reconsideración Objeción    | Observaciones                          | Reconsideración de objeción         |
| 10    | Desistimiento               | Observaciones                          | Desistimiento del asegurado         |
| 11    | Ratificación Liquidación    | Observaciones                          | Ratificación de liquidación         |
| 12    | Ratificación Objeción       | Observaciones                          | Ratificación de objeción            |
| 13    | Prescripción                | Observaciones                          | Prescripción del caso               |
| 14    | Proceso Jurídico            | Observaciones                          | Inicio de proceso legal             |
| 15    | Finalizado                  | Observaciones                          | Cierre administrativo               |
| 16    | Pagado                      | Observaciones                          | Pago realizado                      |

---

## Lógica de Extracción

### Etapas 1-2: Campos del Sistema

```typescript
// Etapa 1: Aviso Siniestro
etapa_1_fecha = fecha_aviso (convertido a DATE)

// Etapa 2: Radicación Compañía
etapa_2_fecha = fecha_notificacion_aseguradora (convertido a DATE)
```

### Etapas 3-16: Extracción desde Observaciones

**Algoritmo:**

1. Convertir observaciones a mayúsculas
2. Buscar palabras clave definidas para cada etapa
3. Extraer fecha que sigue a la palabra clave
4. Normalizar formato de fecha
5. Validar fecha extraída

**Ejemplo de código:**

```typescript
private extractDateFromObservation(text: string, keywords: string[]): string | null {
  const upperText = text.toUpperCase();

  for (const keyword of keywords) {
    // Buscar patrón: PALABRA + separador + fecha
    const pattern = new RegExp(
      `${keyword}[:\\s-]*(\\d{1,2}[\\/\\-\\.]\\d{1,2}[\\/\\-\\.]\\d{2,4})`,
      'i'
    );

    const match = upperText.match(pattern);
    if (match) {
      return this.normalizeDate(match[1]);
    }
  }

  return null;
}
```

---

## Formatos de Fecha Soportados

El sistema reconoce los siguientes formatos:

| Formato    | Ejemplo    | Resultado  |
| ---------- | ---------- | ---------- |
| DD/MM/YYYY | 15/03/2024 | 2024-03-15 |
| DD-MM-YYYY | 15-03-2024 | 2024-03-15 |
| DD.MM.YYYY | 15.03.2024 | 2024-03-15 |
| YYYY/MM/DD | 2024/03/15 | 2024-03-15 |
| YYYY-MM-DD | 2024-03-15 | 2024-03-15 |
| DD/MM/YY   | 15/03/24   | 2024-03-15 |

**Nota:** Para años de 2 dígitos:

- 00-49 → 2000-2049
- 50-99 → 1950-1999

---

## Palabras Clave por Etapa

### Búsqueda Case-Insensitive

Todas las búsquedas son insensibles a mayúsculas/minúsculas.

### Variaciones de Caracteres Especiales

El sistema maneja automáticamente las variaciones de caracteres acentuados:

- `Ó` ↔ `O`
- `Í` ↔ `I`

### Tabla de Palabras Clave

| Etapa | Palabras Clave              | Variaciones                                              |
| ----- | --------------------------- | -------------------------------------------------------- |
| 3     | AJUSTADOR                   | Ajustador, ajustador                                     |
| 4     | DOCUMENTOS ADICIONALES      | Documentos adicionales, docs adicionales                 |
| 5     | ASISTENCIA                  | Asistencia, asistencia técnica                           |
| 6     | LIQUIDACIÓN                 | Liquidación, Liquidacion, liquidación                    |
| 7     | OBJECIÓN                    | Objeción, Objecion, objeción                             |
| 8     | RECONSIDERACIÓN LIQUIDACIÓN | Reconsideración liquidación, Reconsideracion liquidacion |
| 9     | RECONSIDERACIÓN OBJECIÓN    | Reconsideración objeción, Reconsideracion objecion       |
| 10    | DESISTIMIENTO               | Desistimiento, desistimiento del caso                    |
| 11    | RATIFICACIÓN LIQUIDACIÓN    | Ratificación liquidación, Ratificacion liquidacion       |
| 12    | RATIFICACIÓN OBJECIÓN       | Ratificación objeción, Ratificacion objecion             |
| 13    | PRESCRIPCIÓN                | Prescripción, Prescripcion, prescripción                 |
| 14    | PROCESO JURÍDICO            | Proceso jurídico, Proceso juridico, proceso legal        |
| 15    | FINALIZADO                  | Finalizado, Cerrado, cerrado administrativamente         |
| 16    | PAGADO                      | Pagado, pago realizado, transferencia realizada          |

---

## Validaciones

### Validación de Fechas

Todas las fechas extraídas pasan por las siguientes validaciones:

1. **Fecha válida:** Debe ser una fecha real (no 32/13/2024)
2. **No futura:** No puede ser posterior a la fecha actual
3. **No anterior a creación:** No puede ser anterior a la fecha de siniestro

**Ejemplo de validación:**

```typescript
private validateDate(dateStr: string, claimStartDate?: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();

  // Check if future date
  if (date > today) return false;

  // Check if before claim start
  if (claimStartDate) {
    const start = new Date(claimStartDate);
    if (date < start) return false;
  }

  return true;
}
```

### Resultado de Validación

| Resultado   | Acción                                      |
| ----------- | ------------------------------------------- |
| ✅ Válida   | Almacenar en tabla `siniestro_etapas`       |
| ❌ Inválida | Rechazar y registrar en `extraction_errors` |

---

## Manejo de Errores

### Tipos de Errores

1. **Palabra clave no encontrada**
   - La observación no contiene la palabra clave de la etapa
   - Resultado: Campo queda NULL

2. **Fecha no parseable**
   - Formato de fecha no reconocido
   - Resultado: Error registrado en log

3. **Fecha inválida**
   - Fecha futura o anterior a inicio del siniestro
   - Resultado: Error registrado, fecha rechazada

### Registro de Errores

Los errores se almacenan en el campo `extraction_errors` de la tabla `siniestro_etapas`:

```json
{
  "extraction_errors": [
    "Stage 6: Date 2025-03-15 failed validation",
    "Stage 10: Invalid date format 'próxima semana'"
  ]
}
```

---

## Triggers de Base de Datos

### Trigger: `trigger_process_sla_extraction`

**Tabla:** `claims`

**Eventos:**

- `AFTER INSERT`
- `AFTER UPDATE` de columnas: `observaciones`, `fecha_aviso`, `fecha_notificacion_aseguradora`

**Función:** `process_sla_extraction()`

**Flujo:**

```
1. Trigger se activa en INSERT/UPDATE
2. Función obtiene datos del siniestro
3. Extrae fechas de etapas 1-2 de campos del sistema
4. Extrae fechas de etapas 3-16 de observaciones
5. Valida todas las fechas
6. Inserta/Actualiza tabla siniestro_etapas
7. Registra errores si los hay
```

**SQL del Trigger:**

```sql
CREATE TRIGGER trigger_process_sla_extraction
    AFTER INSERT OR UPDATE OF observaciones, fecha_aviso, fecha_notificacion_aseguradora
    ON claims
    FOR EACH ROW
    EXECUTE FUNCTION process_sla_extraction();
```

---

## Ejemplos de Extracción

### Ejemplo 1: Observación Simple

**Observación:**

```
Siniestro reportado. AJUSTADOR asignado el 15/03/2024.
LIQUIDACIÓN propuesta el 20/04/2024.
```

**Resultado:**

- Etapa 3 (Ajustador): 2024-03-15
- Etapa 6 (Liquidación): 2024-04-20

### Ejemplo 2: Múltiples Etapas

**Observación:**

```
DESISTIMIENTO presentado el 10/05/2024.
El cliente decide no continuar con el proceso.
```

**Resultado:**

- Etapa 10 (Desistimiento): 2024-05-10

### Ejemplo 3: Formato Variado

**Observación:**

```
Proceso jurídico iniciado: 2024-06-15
PRESCRIPCIÓN - 2024-12-31
```

**Resultado:**

- Etapa 14 (Proceso Jurídico): 2024-06-15
- Etapa 13 (Prescripción): 2024-12-31

### Ejemplo 4: Sin Etapas Reconocidas

**Observación:**

```
Cliente contactado por teléfono. Sin novedades.
```

**Resultado:**

- Todas las etapas 3-16: NULL
- No se registran errores (es válido no tener etapas)

---

## Performance

### Optimización

- Índices en tabla `siniestro_etapas` por cada columna de etapa
- Trigger eficiente con manejo de excepciones
- Procesamiento batch para migración histórica

### Consideraciones

- Observaciones muy largas pueden afectar performance
- Regex optimizados para búsqueda rápida
- Validaciones ocurren antes de INSERT para evitar transacciones fallidas

---

## Mantenimiento

### Monitoreo

Revisar periódicamente:

1. Cantidad de errores de extracción
2. Cobertura de etapas por siniestro
3. Tiempo de procesamiento del trigger

### Mejoras Futuras

- [ ] Soporte para más formatos de fecha
- [ ] Machine learning para detección de etapas
- [ ] Corrección automática de fechas con OCR

---

## Referencias

- [RFC 3339](https://tools.ietf.org/html/rfc3339) - Formato de fecha/hora
- [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) - Estándar de fechas
- PostgreSQL Regex Documentation
