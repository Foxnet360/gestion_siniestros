## Context

Currently, the `estado_softseguros` field populated from SoftSeguros exports often contains compound status strings, such as `Siniestro Cerrado - Desistimiento` or `Siniestro Abierto - En Analisis`. The claims data ingestion process currently maps this raw value directly or uses basic normalization, leading to inconsistencies when trying to categorize the `estado_interno`. This makes KPIs and state tracking unreliable because the actual business state is often the *last* part of that compound string.

## Goals / Non-Goals

**Goals:**
- Extract the true, final business state from the compound `estado_softseguros` string during the data ingestion process.
- Map the extracted status to a normalized `estado_interno` value automatically.
- Ensure the extraction logic handles variations in whitespace and missing delimiters gracefully.

**Non-Goals:**
- We are not changing the database schema.
- We are not changing how the frontend reads or displays the data, only how it is ingested and saved to the database.
- We are not building a complex NLP-based state inference engine.

## Decisions

**Decision 1: String splitting as the primary extraction method**
- **Rationale**: The SoftSeguros export format reasonably consistently uses a hyphen (`-`) as a delimiter for compound states. Splitting by `-` and taking the last trimmed element `state.split('-').pop()?.trim()` is the most robust, lightweight approach to find the most specific state.
- **Alternatives Considered**: Using complex Regular Expressions to match specific keywords. This was rejected because it is harder to maintain and prone to breaking if new, unknown statuses are added by users in SoftSeguros.

**Decision 2: Normalization at the extraction edge (Ingestion script)**
- **Rationale**: By applying this logic in the ingestion service/script (before reaching the database), we ensure that the database `estado_interno` is always clean. We can also easily trigger `timeline` audit events if the state changes compared to the previous run.
- **Alternatives Considered**: Using a PostgreSQL database trigger. Rejected because the application layer is much better suited to string manipulation, logging, and dispatching side-effects like timeline updates.

## Risks / Trade-offs

- **Risk: Inconsistent delimiters in SoftSeguros** -> **Mitigation**: If a string does not contain a hyphen, `split('-').pop()` will simply return the original string. The logic inherently falls back safely to the original behavior.
- **Risk: The last segment is not the desired state** -> **Mitigation**: We will need to review the existing data to ensure this assumption (`last part = most specific state`) holds true for the vast majority of historical cases. A dry-run of the script is recommended before full deployment.
