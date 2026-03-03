## Why

El sistema SGS requiere usuarios iniciales de producción para comenzar operaciones. Es necesario crear 13 usuarios con diferentes roles (ADMIN, TECNICO, GERENTE) que corresponden al equipo actual de trabajo. Todos los usuarios deben tener una contraseña inicial estándar que deberán cambiar en su primer inicio de sesión.

## What Changes

- Crear script SQL para insertar 13 usuarios de producción en la tabla `users` y `auth.users` de Supabase
- Asignar roles específicos: 2 ADMIN, 4 TECNICO, 7 GERENTE
- Establecer contraseña inicial "SGS123456" para todos los usuarios (deben cambiarla al primer login)
- Generar UUIDs únicos para cada usuario
- Asignar iniciales automáticas basadas en los nombres

**Usuarios a crear:**

**ADMIN (2):**

- Maryory Espinosa Sánchez - indemnizaciones@correseguros.co
- Alejandro Cardona - info@correseguros.co

**TECNICO (4):**

- Sara Lucía Bedoya Velásquez - indemnizaciones1@correseguros.co
- Sandra Echeverri - tecnico.vida@correseguros.co
- Gonzalo Duque Restrepo - tecnico.jfaseguros@correseguros.co
- Yobani Gomez - asistente.jfaseguros@correseguros.co

**GERENTE (7):**

- Luz Elena - elenacorreseguros@gmail.com
- Manuel Antonio Velasquez León - gerencia.comercial@correseguros.co
- Carlos Enrique Vallejo - carlosvallejo@seacompetitivo.com
- Claudia Arbelaez - procesosyproyectos@correseguros.co
- Luis alberto Gallón - director2jfaseguros@correseguros.co
- Alejandro Uribe Velez - auribe@uvseguros.com.co
- Lisimaco cifuentes - lisimacocorreseguros@gmail.com

## Capabilities

### New Capabilities

- `bulk-user-creation`: Script para crear múltiples usuarios de producción con contraseña inicial estándar

### Modified Capabilities

- Ninguno - esta es una operación de datos inicial

## Impact

- **Base de datos:** Inserciones en tablas `users` y `auth.users` de Supabase
- **Seguridad:** Contraseña inicial debe ser cambiada por los usuarios en primer login
- **Auditoría:** No requiere auditoría específica (creación inicial)
- **Dependencias:** Requiere que el schema de user management esté ya implementado
