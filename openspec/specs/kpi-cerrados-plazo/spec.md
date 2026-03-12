# Specification: KPI % Cerrados en Plazo

## Purpose
Establecer los lineamientos técnicos y de negocio para el cálculo del indicador de cumplimiento de SLA (Service Level Agreement) basado en siniestros cerrados dentro del plazo objetivo de días hábiles.

## Requirements

### 1. Cálculo basado en Días Hábiles
- **Requirement:** El tiempo transcurrido entre el inicio y el fin del siniestro (Lead Time) debe calcularse exclusivamente en **días hábiles**.
- **Contexto:** Se deben excluir los fines de semana (sábados y domingos) y los días feriados correspondientes al calendario de Colombia.

### 2. Definición de SLA Cumplido
- **Requirement:** Un siniestro se considera "Cerrado en Plazo" si su tiempo de resolución en días hábiles es menor o igual al `TIEMPO_OBJETIVO_CIERRE` (actualmente configurado en 45 días hábiles).

### 3. Fórmula del KPI (Denominador Correcto)
- **Requirement:** El cálculo del porcentaje debe realizarse sobre el universo de siniestros **cerrados** (finalizados), ignorando los siniestros activos o en proceso.
- **Fórmula:** `(Cantidad de Siniestros Cerrados en Plazo / Cantidad Total de Siniestros Cerrados) * 100`

### 4. Consistencia Backend - Frontend
- **Requirement:** El cálculo reportado por los endpoints del backend (`calculateOverviewFromEtapas`, `calculateOverviewFromClaims`) debe arrojar exactamente el mismo resultado que las métricas calculadas en el cliente (`useKpiOperativos.ts`), garantizando el uso unificado de la fórmula de días hábiles.

## Scenarios

#### Scenario: Cálculo de Siniestros sin Finalizar
- **GIVEN** un universo de siniestros donde todos están activos (ninguno finalizado)
- **WHEN** se calcula el KPI "% Cerrados en Plazo"
- **THEN** el resultado debe ser `0%` sin causar errores de división por cero.

#### Scenario: Cálculo de Siniestros con SLA Excedido por Feriados
- **GIVEN** un siniestro que tardó 50 días naturales en cerrarse
- **AND** 6 de esos días correspondieron a fines de semana y 2 a feriados oficiales colombianos (total = 42 días hábiles)
- **WHEN** se evalúa si cumple el SLA de 45 días
- **THEN** el siniestro se marca como "Cerrado en Plazo" porque `42 <= 45`.

#### Scenario: Siniestros con Fechas Faltantes
- **GIVEN** un siniestro cerrado que carece de fecha inicial o fecha de cierre en la base de datos
- **WHEN** se evalúa su cumplimiento de SLA
- **THEN** el siniestro se excluye del conteo de "Cerrados en Plazo", aunque podría seguir incluyéndose en el denominador total de siniestros cerrados si se puede confirmar factualmente su estado de cerrado.
