## ADDED Requirements

### Requirement: Script SQL de creación masiva de usuarios

El sistema DEBE proporcionar un script SQL que cree múltiples usuarios de producción con contraseña inicial estándar.

#### Scenario: Creación exitosa de 13 usuarios

- **WHEN** se ejecuta el script SQL en Supabase SQL Editor
- **THEN** se crean 13 usuarios en las tablas `auth.users` y `public.users`
- **AND** cada usuario tiene su email, nombre, rol e iniciales correctos
- **AND** todos los usuarios tienen la contraseña inicial "SGS123456"
- **AND** todos los usuarios están activos (is_active = true)

#### Scenario: Verificación de usuarios ADMIN

- **WHEN** se consultan los usuarios con rol 'ADMIN'
- **THEN** se encuentran exactamente 2 usuarios:
  - Maryory Espinosa Sánchez (indemnizaciones@correseguros.co)
  - Alejandro Cardona (info@correseguros.co)

#### Scenario: Verificación de usuarios TECNICO

- **WHEN** se consultan los usuarios con rol 'TECNICO'
- **THEN** se encuentran exactamente 4 usuarios:
  - Sara Lucía Bedoya Velásquez (indemnizaciones1@correseguros.co)
  - Sandra Echeverri (tecnico.vida@correseguros.co)
  - Gonzalo Duque Restrepo (tecnico.jfaseguros@correseguros.co)
  - Yobani Gomez (asistente.jfaseguros@correseguros.co)

#### Scenario: Verificación de usuarios GERENTE

- **WHEN** se consultan los usuarios con rol 'GERENTE'
- **THEN** se encuentran exactamente 7 usuarios:
  - Luz Elena (elenacorreseguros@gmail.com)
  - Manuel Antonio Velasquez León (gerencia.comercial@correseguros.co)
  - Carlos Enrique Vallejo (carlosvallejo@seacompetitivo.com)
  - Claudia Arbelaez (procesosyproyectos@correseguros.co)
  - Luis alberto Gallón (director2jfaseguros@correseguros.co)
  - Alejandro Uribe Velez (auribe@uvseguros.com.co)
  - Lisimaco cifuentes (lisimacocorreseguros@gmail.com)

#### Scenario: Iniciales generadas correctamente

- **WHEN** se revisan los usuarios creados
- **THEN** Maryory Espinosa Sánchez tiene iniciales "MES"
- **AND** Alejandro Cardona tiene iniciales "AC"
- **AND** Sara Lucía Bedoya Velásquez tiene iniciales "SLBV"
- **AND** Sandra Echeverri tiene iniciales "SE"
- **AND** Gonzalo Duque Restrepo tiene iniciales "GDR"
- **AND** Yobani Gomez tiene iniciales "YG"
- **AND** Luz Elena tiene iniciales "LE"
- **AND** Manuel Antonio Velasquez León tiene iniciales "MAVL"
- **AND** Carlos Enrique Vallejo tiene iniciales "CEV"
- **AND** Claudia Arbelaez tiene iniciales "CA"
- **AND** Luis alberto Gallón tiene iniciales "LAG"
- **AND** Alejandro Uribe Velez tiene iniciales "AUV"
- **AND** Lisimaco cifuentes tiene iniciales "LC"

#### Scenario: Contraseña inicial funcional

- **WHEN** un usuario intenta iniciar sesión con su email y contraseña "SGS123456"
- **THEN** el login es exitoso
- **AND** el usuario puede acceder al sistema según su rol

### Requirement: Script idempotente

El script SQL DEBE ser idempotente - si se ejecuta múltiples veces, no debe crear duplicados ni fallar.

#### Scenario: Ejecución repetida del script

- **WHEN** el script ya se ejecutó una vez
- **AND** se ejecuta nuevamente
- **THEN** no se crean usuarios duplicados
- **AND** el script completa sin errores
