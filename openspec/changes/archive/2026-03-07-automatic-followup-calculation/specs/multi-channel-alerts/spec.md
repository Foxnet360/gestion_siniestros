## ADDED Requirements

### Requirement: Display alerts in user interface

The system SHALL display visual alerts in the UI for claims requiring attention based on their `alert_level`.

#### Scenario: Warning alert display

- **WHEN** a claim has `alert_level` = "warning"
- **AND** a user views the claims list or claim detail
- **THEN** the system SHALL display a yellow/amber indicator or badge
- **AND** the indicator SHALL show the number of days until prescription or overdue follow-up

#### Scenario: Critical alert display

- **WHEN** a claim has `alert_level` = "critical"
- **AND** a user views the claims list or claim detail
- **THEN** the system SHALL display a red indicator or badge
- **AND** the indicator SHALL prominently show the urgency
- **AND** the claim SHALL be prioritized in the claims list view

#### Scenario: Alert detail on hover/click

- **WHEN** a user hovers over or clicks an alert indicator
- **THEN** the system SHALL display a tooltip or modal with details:
  - Type of alert (prescription warning, overdue follow-up, legal stagnation)
  - Relevant dates
  - Suggested actions

### Requirement: Send email notifications

The system SHALL send email notifications to relevant users based on alert levels and configured preferences.

#### Scenario: Warning email notification

- **WHEN** a claim enters "warning" alert level
- **AND** the assigned technician has email notifications enabled
- **THEN** the system SHALL send an email within 24 hours
- **AND** the email SHALL include claim details and relevant dates

#### Scenario: Critical email notification

- **WHEN** a claim enters "critical" alert level
- **AND** the assigned technician has email notifications enabled
- **THEN** the system SHALL send an email immediately
- **AND** the email SHALL be marked as high priority
- **AND** the email SHALL include escalation contacts

#### Scenario: Daily digest email

- **WHEN** the daily digest time is reached (default 8:00 AM)
- **THEN** the system SHALL send a digest email to each user with active claims
- **AND** the digest SHALL group alerts by severity
- **AND** users SHALL be able to opt-out of digest while keeping individual alerts

### Requirement: Respect user notification preferences

The system SHALL respect individual user preferences for notification channels and frequency.

#### Scenario: Disable email notifications

- **WHEN** a user disables email notifications in their profile
- **THEN** the system SHALL NOT send email alerts to that user
- **AND** alerts SHALL still be visible in the UI

#### Scenario: Configure digest frequency

- **WHEN** a user sets digest frequency to "weekly" in their profile
- **THEN** the system SHALL send digest emails weekly instead of daily
- **AND** critical alerts SHALL still be sent immediately regardless of digest setting
