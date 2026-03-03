## ADDED Requirements

### Requirement: Generación automática de bitácora

Al guardar los cambios en el formulario de edición, el sistema DEBE crear automáticamente un nuevo registro en la bitácora del siniestro.

#### Scenario: Creación de entrada en bitácora al guardar

- **WHEN** un usuario hace clic en el botón "Guardar" del formulario de edición
- **THEN** el sistema DEBE crear un nuevo registro en la tabla de timeline/bitácora
- **AND** el registro DEBE estar asociado al siniestro que se está editando

### Requirement: Formato estricto de bitácora

Cada entrada en la bitácora DEBE seguir el formato exacto: `Fecha: [DD/MM/YYYY] - Funcionario: [Nombre Usuario] - Seg: "[Estado]" [Descripción]`

#### Scenario: Formato correcto de entrada de bitácora

- **WHEN** el sistema genera una entrada de bitácora
- **THEN** el texto DEBE comenzar con "Fecha: " seguido de la fecha actual en formato DD/MM/YYYY
- **AND** DEBE incluir " - Funcionario: " seguido del nombre completo del usuario logueado
- **AND** DEBE incluir " - Seg: \"" seguido del estado seleccionado y cerrar comillas
- **AND** DEBE terminar con un espacio y la descripción ingresada por el usuario

#### Scenario: Ejemplo de formato de bitácora

- **WHEN** el usuario "Maryory Espinosa" guarda cambios el 14/11/2024
- **AND** el estado seleccionado es "PROCESO JURÍDICO"
- **AND** la descripción es "Lisimaco informa que asistieron a la audiencia"
- **THEN** la entrada en bitácora DEBE ser: `Fecha: 14/11/2024 - Funcionario: Maryory Espinosa - Seg: "PROCESO JURÍDICO" Lisimaco informa que asistieron a la audiencia`

### Requirement: Registro de fecha del evento

La entrada en bitácora DEBE registrar la fecha exacta del momento en que se guarda el seguimiento.

#### Scenario: Fecha actual del sistema

- **WHEN** un usuario guarda un seguimiento
- **THEN** el sistema DEBE usar la fecha del servidor en el momento del guardado
- **AND** el formato DEBE ser DD/MM/YYYY (día/mes/año con 4 dígitos)

### Requirement: Identificación del funcionario

La entrada en bitácora DEBE incluir el nombre completo del funcionario que realiza la acción.

#### Scenario: Nombre del usuario logueado

- **WHEN** un usuario autenticado guarda un seguimiento
- **THEN** el sistema DEBE obtener el nombre completo del usuario desde el contexto de autenticación
- **AND** DEBE incluir ese nombre en el campo "Funcionario" de la bitácora

### Requirement: Captura del estado

La entrada en bitácora DEBE reflejar el estado seleccionado en el dropdown al momento de guardar.

#### Scenario: Estado seleccionado en el formulario

- **WHEN** un usuario selecciona un estado del dropdown
- **AND** hace clic en "Guardar"
- **THEN** el sistema DEBE usar el valor seleccionado en el campo "Seg" de la bitácora
- **AND** el valor DEBE estar entre comillas dobles

### Requirement: Captura de descripción

La entrada en bitácora DEBE incluir el texto libre ingresado por el funcionario en el campo de descripción.

#### Scenario: Descripción del usuario

- **WHEN** un usuario ingresa texto en el campo de descripción
- **AND** hace clic en "Guardar"
- **THEN** el sistema DEBE incluir el texto completo al final de la entrada de bitácora
- **AND** DEBE haber un espacio entre las comillas de cierre del estado y la descripción
