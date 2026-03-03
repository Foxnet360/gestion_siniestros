## ADDED Requirements

### Requirement: Actualización de fecha de último seguimiento

Al guardar los cambios en el formulario de edición, el sistema DEBE actualizar el campo "Próxima Fecha de ÚLTIMO SEGUIMIENTO" del siniestro.

#### Scenario: Actualización automática de fecha

- **WHEN** un usuario hace clic en "Guardar" en el formulario de edición
- **THEN** el sistema DEBE actualizar el campo "Próxima Fecha de ÚLTIMO SEGUIMIENTO" en la tabla de claims
- **AND** el valor DEBE ser la fecha seleccionada en el campo de próxima fecha del formulario

### Requirement: Persistencia de cambios

Los cambios realizados al campo de fecha DEBEN persistirse en la base de datos junto con la entrada de bitácora.

#### Scenario: Transacción atómica

- **WHEN** un usuario guarda un seguimiento
- **THEN** el sistema DEBE actualizar el campo de fecha del siniestro
- **AND** el sistema DEBE crear la entrada en bitácora
- **AND** ambas operaciones DEBEN realizarse en una sola transacción (ambas exitosas o ninguna)

### Requirement: Fecha editable

El campo "Próxima Fecha de ÚLTIMO SEGUIMIENTO" DEBE ser editable por el usuario antes de guardar.

#### Scenario: Modificación de fecha por el usuario

- **WHEN** un usuario visualiza el formulario de edición
- **THEN** el campo de próxima fecha DEBE mostrar la fecha actual del siniestro
- **AND** el usuario DEBE poder cambiar esta fecha mediante el selector de fecha
- **AND** la nueva fecha seleccionada DEBE usarse al guardar

### Requirement: Validación de fecha

El sistema DEBE validar que la fecha de próximo seguimiento sea una fecha válida y no esté en el pasado.

#### Scenario: Validación de fecha futura

- **WHEN** un usuario selecciona una fecha en el pasado
- **AND** intenta guardar el formulario
- **THEN** el sistema DEBE mostrar un mensaje de error
- **AND** NO DEBE permitir el guardado hasta que se seleccione una fecha válida (hoy o futura)
