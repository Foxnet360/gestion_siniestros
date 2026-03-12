## ADDED Requirements

### Requirement: Estado Interno Normalization from SoftSeguros State
During ingestion, the system must extract the most recent state from the `estado_softseguros` field and map it to `estado_interno`.

#### Scenario: Extracting the last state from a combined state string
- **WHEN** `estado_softseguros` contains one or more states separated by hyphens ("-")
- **THEN** the system must split the string by the hyphen delimiter
- **AND** extract the last element of the resulting array
- **AND** apply trim to remove leading/trailing whitespace
- **AND** assign this normalized value to the `estado_interno` field of the claim

## MODIFIED Requirements

### Requirement: Field Ownership Classification
The system must classify all claim fields into three ownership categories that determine update behavior during ingestion.

#### Scenario: SoftSeguros-Owned Fields Always Update
- **WHEN** Excel data is ingested
- **THEN** the following 24 fields must be updated from Excel regardless of existing values:
  - `numero_siniestro`, `numero_siniestro_compania`, `tipo_siniestro`
  - `fecha_siniestro`, `fecha_aviso`, `fecha_notificacion_aseguradora`
  - `proveedor_asignado`, `descripcion`, `poliza`
  - `nombre_asegurado`, `documento_asegurado`, `valor_indemnizacion`
  - `riesgo`, `cliente`, `email_principal`, `celular_principal`
  - `aseguradora`, `subramo`, `porcentaje_siniestralidad`
  - `estado_softseguros`, `finalizado`, `fecha_finalizacion`
  - `usuario_registra_siniestro`, `ultimo_seguimiento_raw`
  - `deducible`, `coaseguros`, `monto_reclamo`

#### Scenario: Internal Fields Never Modified by Ingestion
- **WHEN** Excel data is ingested
- **THEN** the following 8 fields must NEVER be modified:
  - `responsable`, `fecha_ultimo_seguimiento`, `prescripcion_ordinaria`
  - `prescripcion_extraordinaria`, `estado_ultima_gestion`, `tecnico`
  - `proximo_seguimiento`, `prioridad`

#### Scenario: Hybrid Fields with Special Logic
- **WHEN** Excel data contains "Gestión" sheet data
- **THEN** `gestion_softseguros` and `estado_gestion_softseguros` must be updated from that sheet

### Requirement: Change Detection and Selective Update
The system must only update fields that have actually changed, preserving database state for unchanged data.

#### Scenario: New Claim Creation
- **WHEN** an Excel row has an `IDENTIFICADOR` not found in the database
- **THEN** a new claim must be created with:
  - All SoftSeguros fields mapped from Excel
  - Internal fields initialized to defaults (`responsable: 'Sin Asignar'`, `prioridad: 'Media'`)
  - `estado_interno` assigned the normalized value from `estado_softseguros`
  - `prescripcion_ordinaria` calculated as `fecha_siniestro + 2 years`
  - `prescripcion_extraordinaria` calculated as `fecha_siniestro + 5 years`
  - Initial `state_history` entry created
  - Initial `timeline` entry created with text "Claim creado desde ingesta"

#### Scenario: Existing Claim with No Changes
- **WHEN** an Excel row matches an existing claim by `IDENTIFICADOR`
- **AND** all SoftSeguros-owned fields have identical values
- **THEN** no database update must occur
- **AND** the claim must be counted as "unchanged" in the ingestion report

#### Scenario: Existing Claim with Field Changes
- **WHEN** an Excel row matches an existing claim by `IDENTIFICADOR`
- **AND** one or more SoftSeguros-owned fields have different values
- **THEN** only the changed fields must be updated
- **AND** `estado_interno` must be updated with the normalized value from `estado_softseguros` if the state changed
- **AND** `updated_at` timestamp must be set to current time
- **AND** all other internal fields must remain unchanged
