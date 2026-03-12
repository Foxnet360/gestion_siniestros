# Guía de Usuario - Sistema de Cálculo Automático de Fechas

## Índice

1. [Introducción](#introducción)
2. [Cómo Funcionan las Fechas de Seguimiento](#cómo-funcionan-las-fechas-de-seguimiento)
3. [Fases del Workflow y Duraciones](#fases-del-workflow-y-duraciones)
4. [Alertas de Prescripción](#alertas-de-prescripción)
5. [Indicadores Visuales](#indicadores-visuales)
6. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## Introducción

El Sistema de Gestión de Siniestros (SGS) ahora incluye **cálculo automático de fechas de seguimiento** basado en el estado actual del siniestro y las reglas de negocio configuradas.

### ¿Qué es el Cálculo Automático?

El sistema calcula automáticamente la próxima fecha de seguimiento cada vez que:

- Creas un nuevo siniestro
- Cambias el estado interno del siniestro
- Visualizas la pestaña de seguimiento

### Beneficios

- ✅ **Ahorro de tiempo**: No necesitas calcular manualmente las fechas
- ✅ **Consistencia**: Todas las fechas siguen las mismas reglas de negocio
- ✅ **Alertas proactivas**: El sistema te advierte cuando un siniestro está cerca de prescribir
- ✅ **Menos errores**: Evita olvidos y fechas incorrectas

---

## Cómo Funcionan las Fechas de Seguimiento

### Fecha de Cálculo

El sistema usa como punto de partida:

- **Hoy**: Para nuevos siniestros o al visualizar
- **Fecha de último seguimiento**: Para continuar el ciclo

### Cálculo por Estado

| Estado Interno                                             | Días para Seguimiento | Descripción                              |
| ---------------------------------------------------------- | --------------------- | ---------------------------------------- |
| **Fase 1-5** (AVISO SINIESTRO, SOLICITUD DOCUMENTOS, etc.) | **10 días**           | Seguimiento estándar cada 10 días        |
| **PROCESO JURÍDICO**                                       | **30-60 días**        | Seguimiento mensual/bimensual según caso |
| **PRESCRIPCIÓN**                                           | **10 días**           | Revisión frecuente hasta cierre          |
| **FINALIZADO / PAGADO**                                    | _Sin seguimiento_     | Siniestro cerrado                        |

### Ejemplos Prácticos

#### Ejemplo 1: Siniestro en Fase 1

```
Estado: AVISO SINIESTRO
Hoy: 06 de marzo de 2026
Próximo seguimiento: 16 de marzo de 2026 (10 días)
```

#### Ejemplo 2: Siniestro en Proceso Jurídico

```
Estado: PROCESO JURÍDICO
Hoy: 06 de marzo de 2026
Próximo seguimiento: 05 de abril de 2026 (30 días)
```

#### Ejemplo 3: Siniestro en Prescripción

```
Estado: PRESCRIPCIÓN
Hoy: 06 de marzo de 2026
Próximo seguimiento: 16 de marzo de 2026 (10 días)
```

---

## Fases del Workflow y Duraciones

### Fase 1: Inicio del Siniestro

- **AVISO SINIESTRO**
- **SOLICITUD DOCUMENTOS**
- **INGRESO CARPETA**
- **ASIGNACIÓN TÉCNICO**

**Duración**: 10 días entre seguimientos

### Fase 2: Documentación y Análisis

- **DOCUMENTACIÓN**
- **ANÁLISIS**

**Duración**: 10 días entre seguimientos

### Fase 3: Liquidación

- **LIQUIDACIÓN**

**Duración**: 10 días entre seguimientos

### Fase 4: Proceso Jurídico

- **PROCESO JURÍDICO**

**Duración**: 30-60 días entre seguimientos

> **Nota**: En esta fase puedes ajustar la fecha entre 30 y 60 días según la situación del cliente.

### Fase 5: Prescripción

- **PRESCRIPCIÓN**

**Duración**: 10 días entre seguimientos

> **Importante**: Seguimiento frecuente para intentar cerrar antes de la prescripción.

---

## Alertas de Prescripción

### ¿Qué es la Prescripción?

La prescripción es el plazo legal máximo para reclamar un siniestro. Después de esta fecha, el siniestro prescribe y no puede ser reclamado.

### Plazos de Prescripción

| Tipo de Ramo              | Prescripción Ordinaria           | Prescripción Extraordinaria          |
| ------------------------- | -------------------------------- | ------------------------------------ |
| **Automóviles**           | 2 años desde fecha de ocurrencia | No aplica                            |
| **Hogar**                 | 2 años desde fecha de ocurrencia | No aplica                            |
| **Vida**                  | 2 años desde fecha de ocurrencia | No aplica                            |
| **Responsabilidad Civil** | 2 años desde fecha de ocurrencia | **5 años** desde fecha de ocurrencia |
| **RC Profesional**        | 2 años desde fecha de ocurrencia | **5 años** desde fecha de ocurrencia |

> **Regla**: Para RC siempre aplica el plazo más largo (5 años).

### Niveles de Alerta

El sistema muestra alertas visuales según los días restantes hasta la prescripción:

| Nivel           | Días Restantes   | Color         | Acción Requerida                         |
| --------------- | ---------------- | ------------- | ---------------------------------------- |
| **Normal**      | Más de 90 días   | 🟢 Verde      | Seguimiento normal                       |
| **Advertencia** | 30-90 días       | 🟡 Amarillo   | Aumentar frecuencia de seguimiento       |
| **Crítica**     | Menos de 30 días | 🔴 Rojo       | **Acción inmediata** - Contactar urgente |
| **Vencida**     | Fecha pasada     | ⚫ Negro/Gris | Siniestro prescrito - Evaluar cierre     |

### Ejemplo de Cálculo de Prescripción

```
Siniestro: SIN-001
Ramo: Automóviles
Fecha de Ocurrencia: 06 de marzo de 2024
Prescripción Ordinaria: 06 de marzo de 2026

Si hoy es: 15 de febrero de 2026
Días restantes: 19 días
Alerta: 🔴 CRÍTICA
```

---

## Indicadores Visuales

### En la Tabla de Siniestros

Cuando ves la lista de siniestros, verás:

- **Badge de Alerta**: Indica el nivel de alerta del siniestro
  - 🟢 Normal
  - 🟡 Advertencia
  - 🔴 Crítica

- **Indicador de Fecha**: Muestra si la fecha fue calculada automáticamente o manualmente
  - 🤖 Calculada automáticamente
  - ✏️ Modificada manualmente

### En la Pestaña de Seguimiento

Al editar un siniestro en la pestaña "Seguimiento":

1. **Fecha Calculada**: Se muestra la fecha propuesta por el sistema
2. **Fecha de Prescripción**: Se muestra la fecha límite legal
3. **Advertencia**: Si la fecha calculada está después de la prescripción
4. **Botón Restaurar**: Para volver a la fecha calculada si la modificaste

### Modificar una Fecha

Si necesitas cambiar la fecha calculada:

1. Haz clic en el campo de fecha
2. Selecciona la nueva fecha
3. El sistema mostrará un indicador de "Modificado manualmente"
4. Puedes hacer clic en "Restaurar fecha calculada" si cambias de opinión

---

## Preguntas Frecuentes

### ¿Puedo cambiar la fecha calculada?

**Sí**, puedes modificarla manualmente. El sistema mostrará un indicador visual para que sepas que fue modificada.

### ¿Qué pasa si no hago seguimiento en la fecha indicada?

El sistema detectará el atraso y marcará el siniestro con alerta de "Seguimiento Atrasado". Aparecerá en los reportes de alertas.

### ¿El sistema cierra automáticamente los siniestros prescritos?

**No**, el sistema marca los siniestros para revisión pero **no los cierra automáticamente**. Los técnicos deben revisar y cerrar manualmente.

### ¿Por qué algunos siniestros no tienen fecha de prescripción?

Los siniestros sin **Fecha de Ocurrencia** no pueden tener fecha de prescripción calculada. Asegúrate de completar este campo.

### ¿Qué pasa con los siniestros de alta prioridad?

Los siniestros marcados como **Prioridad ALTA**:

- No se cierran automáticamente por prescripción
- Requieren aprobación manual del supervisor
- Generan alertas más frecuentes

### ¿Puedo desactivar el cálculo automático?

**No**, el cálculo automático es una función central del sistema. Sin embargo, siempre puedes modificar las fechas manualmente cuando sea necesario.

### ¿Cómo sé si un siniestro está cerca de prescribir?

Verás:

1. Un badge de alerta 🟡 o 🔴 en la tabla
2. Un mensaje de advertencia en la pestaña de seguimiento
3. El siniestro aparecerá en el panel de alertas si está en nivel crítico

### ¿Qué hacer cuando un siniestro está en alerta crítica?

1. **Contacta al cliente inmediatamente**
2. Intenta obtener la documentación pendiente
3. Evalúa si se puede cerrar el siniestro
4. Si es RC, verifica si aplica prescripción extraordinaria (5 años)
5. Documenta todas las acciones en el timeline

---

## Soporte

Si tienes dudas o encuentras problemas con el cálculo automático de fechas:

- **Email**: soporte@seguros.com
- **Extensión**: 1234
- **Horario**: Lunes a Viernes, 8:00 - 18:00

---

**Última actualización**: Marzo 2026  
**Versión**: 1.0
