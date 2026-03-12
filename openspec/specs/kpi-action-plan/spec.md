# Purpose

Display and manage pending tasks and action items in the Plan de Acción section with completion tracking.

## Requirements

### Requirement: Pending Tasks List

The system SHALL display a list of pending tasks and action items in the Plan de Acción section.

#### Scenario: Display task list

- **WHEN** the user accesses the action plan section
- **THEN** the system SHALL display a scrollable list of pending tasks
- **AND** SHALL show each task with a checkbox for completion tracking
- **AND** SHALL display the task description clearly

#### Scenario: Task with status badge

- **WHEN** viewing a task in the list
- **THEN** the system SHALL display a status badge indicating current state:
  - "EN PROCESO" (blue badge)
  - "PENDIENTE" (orange badge)
  - "VALIDANDO CON ASEGURADORAS" (yellow badge with warning icon)

### Requirement: Task Completion Actions

The system SHALL provide action buttons for managing task completion status.

#### Scenario: Mark task as completed

- **WHEN** the user clicks "Marcar como Completada"
- **THEN** the system SHALL update the task status to completed
- **AND** SHALL visually indicate completion (strikethrough, checkmark, or removal)
- **AND** SHALL move the task to a "Completadas" section or archive

#### Scenario: Task status toggle

- **WHEN** the user clicks on a task status badge
- **THEN** the system SHALL cycle through available statuses
- **AND** SHALL persist the status change

### Requirement: Task Categories

The system SHALL organize tasks by categories or priorities.

#### Scenario: Display categorized tasks

- **WHEN** the action plan loads
- **THEN** the system SHALL group tasks by category if applicable
- **AND** SHALL display category headers

#### Scenario: Priority indicators

- **WHEN** viewing tasks
- **THEN** the system SHALL display priority indicators for urgent tasks
- **AND** SHALL sort tasks by priority (high priority first)

### Requirement: Action Plan Summary

The system SHALL display a summary of the action plan progress.

#### Scenario: Progress overview

- **WHEN** the user views the action plan section
- **THEN** the system SHALL display a progress indicator showing:
  - Total tasks count
  - Completed tasks count
  - Pending tasks count
  - Completion percentage

#### Scenario: Empty state

- **WHEN** no pending tasks exist
- **THEN** the system SHALL display a message "No hay tareas pendientes"
- **AND** SHALL show a celebratory or positive visual indicator
