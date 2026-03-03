## ADDED Requirements

### Requirement: Pestaña de edición visible

El sistema DEBE mostrar una pestaña llamada "Editar" en la vista de detalle de siniestros.

#### Scenario: Visualización de pestaña Editar

- **WHEN** un usuario accede a la vista de detalle de un siniestro
- **THEN** el sistema DEBE mostrar una pestaña etiquetada como "Editar" junto a las demás pestañas disponibles

### Requirement: Formulario pre-diligenciado

Al seleccionar la pestaña "Editar", el sistema DEBE cargar un formulario con los datos actuales del siniestro pre-diligenciados.

#### Scenario: Carga de datos del siniestro

- **WHEN** un usuario hace clic en la pestaña "Editar"
- **THEN** el sistema DEBE mostrar un formulario con los campos: estado actual, próxima fecha de seguimiento, y descripción
- **AND** cada campo DEBE estar pre-poblado con los valores actuales del siniestro seleccionado

### Requirement: Estados disponibles

El formulario DEBE incluir un dropdown (select) con los estados válidos del flujo de trabajo del siniestro.

#### Scenario: Visualización de estados disponibles

- **WHEN** un usuario abre el formulario de edición
- **THEN** el sistema DEBE mostrar un dropdown con los estados: "PROCESO JURÍDICO", "EN GESTIÓN", "PENDIENTE DOCUMENTACIÓN", "CERRADO"
- **AND** el estado actual del siniestro DEBE estar seleccionado por defecto

### Requirement: Campo de descripción

El formulario DEBE incluir un campo de texto libre para que el funcionario ingrese la descripción del seguimiento.

#### Scenario: Ingreso de descripción

- **WHEN** un usuario está editando el formulario de seguimiento
- **THEN** el sistema DEBE proporcionar un área de texto (textarea) de múltiples líneas
- **AND** el campo DEBE aceptar texto libre con un máximo de 2000 caracteres

### Requirement: Campo de próxima fecha

El formulario DEBE incluir un campo de fecha para establecer la próxima fecha de seguimiento.

#### Scenario: Selección de próxima fecha

- **WHEN** un usuario está editando el formulario de seguimiento
- **THEN** el sistema DEBE proporcionar un selector de fecha (date picker)
- **AND** el campo DEBE estar pre-poblado con la fecha actual de "Próxima Fecha de ÚLTIMO SEGUIMIENTO" del siniestro
