## ADDED Requirements

### Requirement: Text-to-stage validation

The system SHALL validate that observation text in novedades is semantically consistent with the reported workflow stage, flagging potential data entry errors.

#### Scenario: Valid stage-text match

- **WHEN** a novedad contains text like "reconsideración liquidación" and reports stage 4
- **THEN** the system SHALL flag this as potentially mismatched
- **AND** display a visual indicator for audit review

### Requirement: Audit indicators

Claims with potential stage-text mismatches SHALL display visual indicators (warnings or badges) to alert users of possible Softseguros data entry errors.

#### Scenario: Mismatch detection

- **WHEN** the system detects text that logically belongs to a different stage
- **THEN** the claim SHALL display an audit warning indicator
- **AND** provide details of the potential mismatch on hover or click

### Requirement: Validation rules configuration

The validation rules mapping text patterns to expected stages SHALL be configurable without code changes.

#### Scenario: Rule updates

- **WHEN** business rules for stage-text matching change
- **THEN** administrators SHALL update validation patterns via configuration
