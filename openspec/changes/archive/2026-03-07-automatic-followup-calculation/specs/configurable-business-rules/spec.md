## ADDED Requirements

### Requirement: Store business rules in database

The system SHALL store all configurable business rules in the `app_config` table to allow modification without code redeployment.

#### Scenario: Follow-up rules configuration

- **WHEN** an ADMIN queries the `app_config` table
- **THEN** the system SHALL return the `follow_up_rules` configuration containing rules for each workflow phase and state
- **AND** the configuration SHALL include days to add for standard phases (10), legal process (30-60), and prescription (10)

#### Scenario: Prescription rules configuration

- **WHEN** an ADMIN queries the `app_config` table
- **THEN** the system SHALL return the `prescription_rules` configuration
- **AND** the configuration SHALL define ordinary prescription (2 years) and extraordinary prescription (5 years for specific ramos)

#### Scenario: Alert thresholds configuration

- **WHEN** an ADMIN queries the `app_config` table
- **THEN** the system SHALL return the `alert_thresholds` configuration
- **AND** the configuration SHALL define warning (90 days), critical (30 days), and auto-close (0 days) thresholds for prescription alerts

### Requirement: Validate configuration on read

The system SHALL validate configuration values when reading from `app_config` and use sensible defaults if configuration is invalid or missing.

#### Scenario: Missing configuration fallback

- **WHEN** the system attempts to read `follow_up_rules` from `app_config`
- **AND** the configuration does not exist or is malformed
- **THEN** the system SHALL use hardcoded default values
- **AND** the system SHALL log a warning about missing configuration

#### Scenario: Invalid configuration handling

- **WHEN** the system reads `prescription_rules` with invalid values (e.g., negative years)
- **THEN** the system SHALL reject the invalid configuration
- **AND** the system SHALL fall back to default values
- **AND** the system SHALL log an error

### Requirement: Audit configuration changes

The system SHALL track all modifications to business rules in the `app_config` table for audit purposes.

#### Scenario: Configuration change audit

- **WHEN** an ADMIN updates any value in `app_config`
- **THEN** the system SHALL update the `updated_at` field to current timestamp
- **AND** the system SHALL record the `updated_by` field with the current user's identifier
- **AND** the system SHALL create an entry in `audit_logs` with the old and new values

### Requirement: Hot-reload configuration

The system SHALL use current configuration values without requiring application restart.

#### Scenario: Immediate rule application

- **WHEN** an ADMIN updates `follow_up_rules` in `app_config`
- **THEN** subsequent calculations SHALL immediately use the new rules
- **AND** no application restart SHALL be required
