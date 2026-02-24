# Capability: Smart Merge Ingestion

## Purpose
Intelligent data merge engine that preserves internal management state while selectively updating only changed fields from SoftSeguros CRM, with automatic timeline generation and field ownership enforcement.

## Requirements

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
- **THEN** the following 9 fields must NEVER be modified:
  - `responsable`, `fecha_ultimo_seguimiento`, `prescripcion_ordinaria`
  - `prescripcion_extraordinaria`, `estado_ultima_gestion`, `tecnico`
  - `proximo_seguimiento`, `estado_interno`, `prioridad`

#### Scenario: Hybrid Fields with Special Logic
- **WHEN** Excel data contains "Gestión" sheet data
- **THEN** `gestion_softseguros` and `estado_gestion_softseguros` must be updated from that sheet

### Requirement: Change Detection and Selective Update
The system must only update fields that have actually changed, preserving database state for unchanged data.

#### Scenario: New Claim Creation
- **WHEN** an Excel row has an `IDENTIFICADOR` not found in the database
- **THEN** a new claim must be created with:
  - All SoftSeguros fields mapped from Excel
  - Internal fields initialized to defaults (`responsable: 'Sin Asignar'`, `estado_interno: 'AVISO SINIESTRO'`, `prioridad: 'Media'`)
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
- **AND** `updated_at` timestamp must be set to current time
- **AND** all internal fields must remain unchanged

### Requirement: Automatic State Change Handling
When the `estado_softseguros` field changes, the system must automatically manage state history and timeline.

#### Scenario: State Change Triggers History Update
- **WHEN** `estado_softseguros` changes from value A to value B
- **THEN** the current open `state_history` entry must be closed:
  - Set `end_date` to current timestamp
  - Calculate `days_duration` as days between `start_date` and `end_date`
- **AND** a new `state_history` entry must be created:
  - `state` = new estado value
  - `start_date` = current timestamp
  - `end_date` = null
  - `days_duration` = null
  - `author` = "Sistema (Ingesta)"

#### Scenario: State Change Generates Timeline Entry
- **WHEN** `estado_softseguros` changes from value A to value B
- **THEN** a timeline entry must be auto-generated:
  - `date` = current timestamp
  - `author` = "Sistema"
  - `text` = "Estado cambió de \"A\" a \"B\""
  - `is_system` = true

### Requirement: Último Seguimiento Parsing
The system must parse the "Último Seguimiento" field and append structured timeline entries.

#### Scenario: Structured Format Parsing
- **WHEN** `ultimo_seguimiento_raw` changes
- **AND** it matches the pattern: `Fecha: DD/MM/YYYY - Funcionario: [name] - Seguimiento: "[state]" [notes]`
- **THEN** a timeline entry must be created:
  - `date` = parsed date from DD/MM/YYYY
  - `author` = extracted funcionario name
  - `text` = concatenated seguimiento and notes
  - `is_system` = false

#### Scenario: Unstructured Format Fallback
- **WHEN** `ultimo_seguimiento_raw` changes
- **AND** it does NOT match the expected pattern
- **THEN** a timeline entry must be created:
  - `date` = current timestamp
  - `author` = "SoftSeguros"
  - `text` = raw text as-is
  - `is_system` = false

### Requirement: Amparos Smart Merge
The system must apply intelligent merge logic to the `amparos` table using the same change-detection principles.

#### Scenario: Amparo Identification by Composite Key
- **WHEN** comparing Excel amparos with database amparos
- **THEN** each amparo must be uniquely identified by the composite key: `amparo + nombre_reclamante`

#### Scenario: New Amparo Insertion
- **WHEN** an Excel amparo has a composite key not found in the database for that claim
- **THEN** a new amparo record must be inserted with all fields from Excel

#### Scenario: Existing Amparo Value Update
- **WHEN** an Excel amparo matches an existing amparo by composite key
- **AND** the `valor` field is different
- **THEN** only the `valor` field must be updated

#### Scenario: Amparo Deletion
- **WHEN** a database amparo exists for a claim
- **AND** that amparo's composite key is NOT present in the Excel data for that claim
- **THEN** the amparo record must be deleted

### Requirement: Ingestion Reporting
The system must provide detailed statistics about the merge operation.

#### Scenario: Comprehensive Merge Report
- **WHEN** ingestion completes
- **THEN** a report must be generated containing:
  - Claims created (count)
  - Claims updated (count)
  - Claims unchanged (count)
  - Amparos inserted (count)
  - Amparos updated (count)
  - Amparos deleted (count)

### Requirement: Performance for Large Datasets
The system must handle large ingestion batches efficiently.

#### Scenario: Batch Processing for Large Datasets
- **WHEN** ingesting more than 1000 claims
- **THEN** processing must occur in batches of 100 claims
- **AND** batches must be processed in parallel where possible

#### Scenario: Database Query Optimization
- **WHEN** performing merge operations
- **THEN** the system must use indexed fields for lookups:
  - `claims.id_softseguros` (primary key)
  - `amparos.claim_id` (foreign key index)
  - `state_history.claim_id` (foreign key index)
  - `timeline.claim_id` (foreign key index)
