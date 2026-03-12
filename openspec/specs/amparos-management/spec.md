# Purpose

TBD - Management of amparos (coverage types) with dropdown selection and admin interface.

## Requirements

### Requirement: Lista desplegable de amparos en formulario de siniestros

El sistema SHALL agregar una lista desplegable (dropdown) en los formularios de creación y edición de siniestros para seleccionar el/los amparo(s) afectado(s).

#### Scenario: Visualización del campo amparos

- **WHEN** un usuario abre el formulario de crear/editar siniestro
- **THEN** el sistema SHALL mostrar un campo "Amparos Afectados" tipo dropdown multiselect
- **AND** SHALL mostrar la lista de amparos disponibles

#### Scenario: Selección de múltiples amparos

- **WHEN** un siniestro afecta múltiples amparos
- **THEN** el usuario SHALL poder seleccionar más de un amparo de la lista
- **AND** el sistema SHALL almacenar todos los amparos seleccionados

#### Scenario: Campo obligatorio

- **WHEN** el usuario intenta guardar un siniestro sin seleccionar amparo
- **THEN** el sistema SHALL mostrar un mensaje de validación indicando que el campo es obligatorio
- **AND** SHALL impedir el guardado hasta que se seleccione al menos un amparo

### Requirement: Extracción de amparos desde "Tipo de siniestro" → "OTRO"

El sistema SHALL extraer la lista de amparos disponibles desde la categoría "OTRO" del campo "Tipo de siniestro" en SS.

#### Scenario: Población inicial de lista

- **WHEN** se inicializa el sistema
- **THEN** el sistema SHALL extraer todos los valores del campo "Tipo de siniestro" donde la categoría sea "OTRO"
- **AND** SHALL poblar la lista desplegable de amparos con estos valores

#### Scenario: Actualización de lista

- **WHEN** se agregan nuevos tipos en la categoría "OTRO"
- **THEN** el sistema SHALL actualizar automáticamente la lista de amparos disponibles

### Requirement: Almacenamiento de amparos seleccionados

El sistema SHALL almacenar los amparos seleccionados asociados al siniestro.

#### Scenario: Guardado de amparos en creación

- **WHEN** se crea un nuevo siniestro con amparos seleccionados
- **THEN** el sistema SHALL guardar la relación siniestro-amparo(s) en la base de datos

#### Scenario: Actualización de amparos en edición

- **WHEN** se edita un siniestro y se modifican los amparos seleccionados
- **THEN** el sistema SHALL actualizar la relación siniestro-amparo(s)
- **AND** SHALL mantener el historial de cambios si aplica

#### Scenario: Visualización de amparos guardados

- **WHEN** se abre un siniestro existente para edición
- **THEN** el sistema SHALL mostrar los amparos previamente seleccionados como seleccionados en el dropdown

### Requirement: Validación cruzada de amparos

El sistema SHALL permitir validaciones cruzadas entre amparos y otros datos del siniestro.

#### Scenario: Validación por ramo

- **WHEN** se selecciona un ramo específico
- **THEN** el sistema SHALL filtrar la lista de amparos mostrando solo los compatibles con ese ramo

### Requirement: Búsqueda en lista de amparos

El sistema SHALL permitir buscar amparos dentro de la lista desplegable.

#### Scenario: Filtrado por texto

- **WHEN** el usuario escribe en el campo de búsqueda del dropdown
- **THEN** el sistema SHALL filtrar la lista mostrando solo los amparos que coincidan con el texto ingresado
- **AND** SHALL realizar la búsqueda de forma case-insensitive

### Requirement: Gestión administrativa de amparos

El sistema SHALL proporcionar una interfaz administrativa para gestionar la lista maestra de amparos.

#### Scenario: Alta de nuevo amparo

- **WHEN** un administrador accede a la gestión de amparos
- **THEN** el sistema SHALL permitir agregar un nuevo amparo a la lista maestra
- **AND** SHALL validar que no exista duplicado

#### Scenario: Baja de amparo

- **WHEN** un administrador desactiva un amparo
- **THEN** el sistema SHALL marcar el amparo como inactivo
- **AND** SHALL mantenerlo en siniestros históricos pero no mostrarlo en nuevos

#### Scenario: Modificación de amparo

- **WHEN** un administrador edita el nombre de un amparo
- **THEN** el sistema SHALL actualizar el nombre manteniendo las relaciones con siniestros existentes
