## Why

Currently, during the ingestion of claims data from Softseguros, the internal state (`estado_interno`) does not accurately reflect the latest status when the `estado_softseguros` field contains multiple combined statuses. We need to normalize the parsing of `estado_softseguros` to correctly identify and assign the most recent state to `estado_interno`. This ensures accurate workflow tracking and state management for claims.

## What Changes

- Modify the data ingestion mapping logic.
- Apply a normalization rule to the `estado_softseguros` field: split the string by the hyphen ("-") delimiter and extract the last element.
- Trim whitespace from the extracted string.
- Assign this extracted, final state as the value for the `estado_interno` field.

## Capabilities

### New Capabilities

### Modified Capabilities
- `smart-merge-ingestion`: Update the data mapping and normalization logic for `estado_interno` based on the split values of `estado_softseguros`.

## Impact

- Claims data ingestion service (`services/` or `scripts/`).
- Only data transformation logic is impacted; no database schema changes are required.
