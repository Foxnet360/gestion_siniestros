# Guía de Administrador - Configuración de Reglas de Negocio

## Índice

1. [Introducción](#introducción)
2. [Acceso al Panel de Configuración](#acceso-al-panel-de-configuración)
3. [Configuración de Follow-Up](#configuración-de-follow-up)
4. [Configuración de Prescripción](#configuración-de-prescripción)
5. [Configuración de Umbrales de Alertas](#configuración-de-umbrales-de-alertas)
6. [Configuración de Notificaciones](#configuración-de-notificaciones)
7. [Configuración de Auto-Cierre](#configuración-de-auto-cierre)
8. [Validación y Seguridad](#validación-y-seguridad)
9. [Auditoría de Cambios](#auditoría-de-cambios)
10. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## Introducción

Esta guía está destinada a **administradores del sistema** que necesitan configurar las reglas de negocio para el cálculo automático de fechas de seguimiento y alertas.

### ¿Qué son las Reglas de Negocio?

Las reglas de negocio son configuraciones que determinan:

- Cuántos días entre seguimientos según el estado
- Plazos de prescripción por tipo de ramo
- Umbrales para niveles de alerta
- Reglas de auto-cierre
- Preferencias de notificación

### Tipos de Configuración

| Configuración             | Descripción                     | Impacto                               |
| ------------------------- | ------------------------------- | ------------------------------------- |
| **follow_up_rules**       | Reglas de cálculo de fechas     | Alto - Afecta todos los siniestros    |
| **prescription_rules**    | Plazos de prescripción          | Alto - Legalmente sensible            |
| **alert_thresholds**      | Umbrales de alertas             | Medio - Cambia visibilidad de alertas |
| **notification_settings** | Configuración de notificaciones | Bajo - Solo afecta emails             |
| **auto_close_rules**      | Reglas de cierre automático     | Alto - Puede cerrar siniestros        |

---

## Acceso al Panel de Configuración

### Requisitos

- Rol de **ADMINISTRADOR** en el sistema
- Acceso al módulo de configuración

### Navegación

1. Inicia sesión en el SGS
2. Ve a **Configuración** > **Reglas de Negocio**
3. Selecciona la pestaña que deseas configurar

### Vista General

El panel muestra:

- Configuración actual
- Valores por defecto
- Historial de cambios
- Opciones para editar cada sección

---

## Configuración de Follow-Up

### Ubicación

**Configuración** > **Reglas de Negocio** > **Follow-Up**

### Campos Configurables

#### Seguimiento Estándar (Fases 1-5)

```json
{
  "standard": {
    "phases": [1, 2, 3, 4, 5],
    "days": 10,
    "description": "Seguimiento cada 10 días para fases 1-5"
  }
}
```

| Campo         | Tipo   | Valor por Defecto | Descripción                     |
| ------------- | ------ | ----------------- | ------------------------------- |
| `phases`      | Array  | [1,2,3,4,5]       | Fases que usan esta regla       |
| `days`        | Número | 10                | Días entre seguimientos (1-365) |
| `description` | Texto  | -                 | Descripción de la regla         |

#### Proceso Jurídico

```json
{
  "legal": {
    "state": "PROCESO JURÍDICO",
    "minDays": 30,
    "maxDays": 60,
    "defaultDays": 30,
    "description": "1-2 meses según situación del cliente"
  }
}
```

| Campo         | Tipo   | Valor por Defecto  | Descripción              |
| ------------- | ------ | ------------------ | ------------------------ |
| `state`       | Texto  | "PROCESO JURÍDICO" | Estado interno           |
| `minDays`     | Número | 30                 | Mínimo de días permitido |
| `maxDays`     | Número | 60                 | Máximo de días permitido |
| `defaultDays` | Número | 30                 | Valor por defecto        |

**Restricciones:**

- `minDays` debe ser menor que `maxDays`
- Valores permitidos: 1-365 días

#### Fase de Prescripción

```json
{
  "prescription": {
    "state": "PRESCRIPCIÓN",
    "days": 10,
    "description": "Revisión cada 10 días hasta cierre"
  }
}
```

### Ejemplo de Configuración Completa

```json
{
  "standard": {
    "phases": [1, 2, 3, 4, 5],
    "days": 15,
    "description": "Seguimiento cada 15 días"
  },
  "legal": {
    "state": "PROCESO JURÍDICO",
    "minDays": 45,
    "maxDays": 90,
    "defaultDays": 45,
    "description": "Seguimiento de 45 a 90 días"
  },
  "prescription": {
    "state": "PRESCRIPCIÓN",
    "days": 7,
    "description": "Revisión semanal"
  }
}
```

---

## Configuración de Prescripción

### Ubicación

**Configuración** > **Reglas de Negocio** > **Prescripción**

### ⚠️ Advertencia Legal

**Los plazos de prescripción están regulados por ley. Modificarlos puede tener implicaciones legales graves. Consulta con el departamento legal antes de hacer cambios.**

### Campos Configurables

#### Prescripción Ordinaria

```json
{
  "ordinary": {
    "years": 2,
    "description": "Prescripción ordinaria - 2 años",
    "excludes": ["Responsabilidad Civil"]
  }
}
```

| Campo      | Tipo   | Valor por Defecto         | Descripción                             |
| ---------- | ------ | ------------------------- | --------------------------------------- |
| `years`    | Número | 2                         | Años para prescripción ordinaria (1-10) |
| `excludes` | Array  | ["Responsabilidad Civil"] | Ramos excluidos de esta regla           |

#### Prescripción Extraordinaria

```json
{
  "extraordinary": {
    "years": 5,
    "description": "Prescripción extraordinaria - 5 años para RC",
    "includes": ["Responsabilidad Civil", "RC Profesional"]
  }
}
```

| Campo      | Tipo   | Valor por Defecto         | Descripción                           |
| ---------- | ------ | ------------------------- | ------------------------------------- |
| `years`    | Número | 5                         | Años para prescripción extraordinaria |
| `includes` | Array  | ["Responsabilidad Civil"] | Ramos que usan este plazo             |

**Restricciones:**

- `extraordinary.years` debe ser mayor que `ordinary.years`
- Máximo permitido: 10 años

### Configuración Completa

```json
{
  "ordinary": {
    "years": 2,
    "description": "Prescripción ordinaria",
    "excludes": ["Responsabilidad Civil"]
  },
  "extraordinary": {
    "years": 5,
    "description": "Prescripción extraordinaria RC",
    "includes": ["Responsabilidad Civil", "RC Profesional"]
  }
}
```

---

## Configuración de Umbrales de Alertas

### Ubicación

**Configuración** > **Reglas de Negocio** > **Umbrales de Alertas**

### Alertas de Prescripción

```json
{
  "prescription": {
    "warning": 90,
    "critical": 30,
    "autoClose": 0,
    "description": "Días antes de vencimiento"
  }
}
```

| Campo       | Tipo   | Valor por Defecto | Descripción                                  |
| ----------- | ------ | ----------------- | -------------------------------------------- |
| `warning`   | Número | 90                | Días para alerta amarilla                    |
| `critical`  | Número | 30                | Días para alerta roja                        |
| `autoClose` | Número | 0                 | Días después de vencimiento para auto-cierre |

**Restricciones:**

- `warning` debe ser mayor que `critical`
- Valores positivos

### Seguimientos Atrasados

```json
{
  "followUp": {
    "overdue": 1,
    "stagnant": 30,
    "description": "Días de atraso"
  }
}
```

| Campo      | Tipo   | Valor por Defecto | Descripción                                   |
| ---------- | ------ | ----------------- | --------------------------------------------- |
| `overdue`  | Número | 1                 | Días después de la fecha para marcar atraso   |
| `stagnant` | Número | 30                | Días de inactividad para marcar estancamiento |

### Estancamiento Jurídico

```json
{
  "legalStagnant": {
    "warningMonths": 24,
    "closeYears": 5,
    "description": "Alertas por estancamiento"
  }
}
```

| Campo           | Tipo   | Valor por Defecto | Descripción                           |
| --------------- | ------ | ----------------- | ------------------------------------- |
| `warningMonths` | Número | 24                | Meses en PROCESO JURÍDICO para alerta |
| `closeYears`    | Número | 5                 | Años para cierre por estancamiento    |

---

## Configuración de Notificaciones

### Ubicación

**Configuración** > **Reglas de Negocio** > **Notificaciones**

### Configuración General

```json
{
  "ui": true,
  "email": true,
  "dailyDigest": true,
  "digestTime": "08:00",
  "criticalOverride": true,
  "description": "Configuración de notificaciones"
}
```

| Campo              | Tipo     | Valor por Defecto | Descripción                        |
| ------------------ | -------- | ----------------- | ---------------------------------- |
| `ui`               | Booleano | true              | Mostrar alertas en la interfaz     |
| `email`            | Booleano | true              | Enviar notificaciones por email    |
| `dailyDigest`      | Booleano | true              | Enviar resumen diario              |
| `digestTime`       | Texto    | "08:00"           | Hora del resumen (formato 24h)     |
| `criticalOverride` | Booleano | true              | Siempre notificar alertas críticas |

### Preferencias Individuales

Los usuarios pueden configurar sus propias preferencias en su perfil:

- Activar/desactivar emails
- Frecuencia del digest (diario/semanal/apagado)
- Notificaciones para alertas críticas (no se puede desactivar)

---

## Configuración de Auto-Cierre

### Ubicación

**Configuración** > **Reglas de Negocio** > **Auto-Cierre**

### ⚠️ Precaución

**Esta configuración puede cerrar automáticamente siniestros. Revisa cuidadosamente antes de guardar.**

### Configuración

```json
{
  "highValueThreshold": 50000000,
  "highPriorityExclusion": ["ALTA"],
  "autoCloseStates": ["PRESCRIPCIÓN"],
  "pendingApprovalState": "CIERRE PENDIENTE APROBACIÓN",
  "description": "Reglas de cierre automático"
}
```

| Campo                   | Tipo   | Valor por Defecto             | Descripción                                |
| ----------------------- | ------ | ----------------------------- | ------------------------------------------ |
| `highValueThreshold`    | Número | 50000000                      | Monto mínimo para aprobación manual ($50M) |
| `highPriorityExclusion` | Array  | ["ALTA"]                      | Prioridades excluidas de auto-cierre       |
| `autoCloseStates`       | Array  | ["PRESCRIPCIÓN"]              | Estados que permiten auto-cierre           |
| `pendingApprovalState`  | Texto  | "CIERRE PENDIENTE APROBACIÓN" | Estado para aprobación manual              |

### Comportamiento

| Condición                                                  | Acción                                    |
| ---------------------------------------------------------- | ----------------------------------------- |
| Siniestro prescrito + Monto < $50M + Prioridad NORMAL/BAJA | ✅ Cierre automático                      |
| Siniestro prescrito + Monto ≥ $50M                         | ⏳ Cambia a "Cierre Pendiente Aprobación" |
| Siniestro prescrito + Prioridad ALTA                       | ⏳ Cambia a "Cierre Pendiente Aprobación" |

---

## Validación y Seguridad

### Validaciones Automáticas

El sistema valida todas las configuraciones antes de guardar:

1. **Tipos de datos**: Números, textos, arrays correctos
2. **Rangos**: Valores dentro de límites permitidos
3. **Lógica**: minDays < maxDays, warning > critical, etc.
4. **Integridad**: Todos los campos requeridos presentes

### Mensajes de Error

Si una configuración es inválida, verás mensajes como:

- "minDays debe ser menor que maxDays"
- "warning debe ser mayor que critical"
- "El valor debe estar entre 1 y 365 días"

### Seguridad

- ✅ Solo usuarios con rol ADMIN pueden modificar configuraciones
- ✅ Todos los cambios se registran en auditoría
- ✅ Se requiere confirmación para cambios críticos
- ✅ Valores por defecto se usan si la configuración es inválida

---

## Auditoría de Cambios

### Registro de Cambios

Todos los cambios en configuraciones se registran con:

- Fecha y hora del cambio
- Usuario que realizó el cambio
- Valor anterior y nuevo
- IP del usuario

### Visualización de Historial

1. Ve a **Configuración** > **Auditoría**
2. Selecciona "Cambios de Configuración"
3. Filtra por fecha, usuario o tipo de configuración

### Ejemplo de Registro

```
Fecha: 2026-03-06 14:30:15
Usuario: admin@seguros.com
Configuración: follow_up_rules
Cambio:
  - standard.days: 10 → 15
  - legal.defaultDays: 30 → 45
IP: 192.168.1.100
```

---

## Preguntas Frecuentes

### ¿Cuándo se aplican los cambios?

Los cambios se aplican **inmediatamente** (hot-reload). No es necesario reiniciar el sistema.

### ¿Puedo revertir un cambio?

Sí, puedes:

1. Restaurar valores por defecto
2. Ver el historial y copiar valores anteriores
3. Crear un script de rollback (consulta con desarrollo)

### ¿Qué pasa si configuro valores inválidos?

El sistema:

1. Rechaza el cambio con mensaje de error
2. Mantiene la configuración anterior
3. No afecta el funcionamiento del sistema

### ¿Puedo exportar la configuración?

Sí, usa el botón "Exportar JSON" para descargar la configuración actual.

### ¿Cómo pruebo cambios antes de aplicarlos?

1. Usa el entorno de **staging/pruebas** primero
2. Verifica el impacto con datos de prueba
3. Consulta con el equipo antes de aplicar en producción

### ¿Los cambios afectan siniestros existentes?

**Sí**, los cambios afectan:

- Cálculos de fechas futuras
- Evaluaciones de alertas nuevas
- No modifica fechas ya calculadas

### ¿Puedo tener configuraciones diferentes por sucursal?

**No**, las configuraciones son globales para toda la organización.

### ¿Qué pasa si borro accidentalmente una configuración?

El sistema usará los **valores por defecto** automáticamente. Puedes restaurar desde el historial.

---

## Contacto y Soporte

Para consultas sobre configuración:

- **Email**: admin@seguros.com
- **Teléfono**: Extensión 9999
- **Horario**: Lunes a Viernes, 9:00 - 17:00

**Emergencias fuera de horario**: Llamar al +1-800-ADMIN-01

---

**Última actualización**: Marzo 2026  
**Versión**: 1.0  
**Nivel de Acceso**: ADMINISTRADOR
