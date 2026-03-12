## 1. Implement Normalization Utility

- [x] 1.1 Create or locate utility function to normalize `estado_softseguros` (split by '-', take last, trim).

## 2. Update Ingestion Mapping

- [x] 2.1 Locate the claim mapping/ingestion logic (e.g., in `services/` or `scripts/`).
- [x] 2.2 Update the mapping for new claims to use the normalized `estado_softseguros` value for `estado_interno`.
- [x] 2.3 Update the change detection logic for existing claims to update `estado_interno` using the normalized value when `estado_softseguros` changes.

## 3. Verify Implementation

- [x] 3.1 Test ingestion with a mock row where `estado_softseguros` contains multiple states separated by hyphens.
- [x] 3.2 Verify that `estado_interno` is updated correctly for both new and existing claims.
- [x] 3.3 Verify that `estado_softseguros` remains stored as the original string.
