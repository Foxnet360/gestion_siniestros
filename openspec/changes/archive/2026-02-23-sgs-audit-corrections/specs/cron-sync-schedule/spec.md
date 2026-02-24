## ADDED Requirements

### Requirement: Sync runs during business hours only

The sync daemon SHALL execute data synchronization hourly within the business hours window of 7:30 AM to 5:30 PM, Monday through Friday.

#### Scenario: Business hours execution

- **WHEN** the current time is between 7:30 AM and 5:30 PM on a weekday
- **THEN** the sync daemon SHALL trigger hourly data synchronization

#### Scenario: Outside business hours

- **WHEN** the current time is outside 7:30 AM to 5:30 PM or on a weekend
- **THEN** the sync daemon SHALL NOT execute synchronization

### Requirement: Configurable cron schedule

The cron job configuration SHALL be easily modifiable through environment variables or configuration files.

#### Scenario: Schedule modification

- **WHEN** an administrator updates the cron schedule configuration
- **THEN** the sync daemon SHALL adopt the new schedule without requiring code changes
