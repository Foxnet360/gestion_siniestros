## ADDED Requirements

### Requirement: Aliado role creation

The system SHALL support a new user role called "Aliado" with restricted access permissions.

#### Scenario: User creation

- **WHEN** an administrator creates a user with role "Aliado"
- **THEN** the system SHALL assign the Aliado role with associated restrictions

### Requirement: Row-level security by aliado_origen

Aliado users SHALL only be able to view claims where the aliado_origen column matches their assigned aliado identifier.

#### Scenario: Aliado login

- **WHEN** a user with Aliado role logs in
- **THEN** all queries SHALL be automatically filtered to show only claims where aliado_origen = user's aliado_id

#### Scenario: Data isolation

- **WHEN** an Aliado user attempts to access a claim not belonging to their aliado_origen
- **THEN** the system SHALL deny access (404 or permission error)

### Requirement: Supabase RLS policies

Database Row-Level Security (RLS) policies SHALL enforce the aliado access restrictions at the database level.

#### Scenario: Direct database access

- **WHEN** queries are executed against the claims table
- **THEN** RLS policies SHALL filter results based on the user's role and aliado_origen
- **AND** Aliado users SHALL NOT see claims from other aliados

### Requirement: Admin bypass

Administrators and non-Aliado roles SHALL continue to have full access to all claims regardless of aliado_origen.

#### Scenario: Admin access

- **WHEN** an administrator queries claims
- **THEN** all claims SHALL be visible without aliado_origen filtering
