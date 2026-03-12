## ADDED Requirements

### Requirement: User login with email and password

El sistema SHALL permitir a los usuarios iniciar sesión usando email y contraseña a través de Supabase Auth.

#### Scenario: Successful login with valid credentials

- **WHEN** un usuario ingresa un email y contraseña válidos en el formulario de login
- **THEN** el sistema SHALL autenticar al usuario usando Supabase Auth
- **AND** el sistema SHALL crear una sesión JWT válida
- **AND** el sistema SHALL redirigir al usuario a su vista correspondiente según su rol

#### Scenario: Failed login with invalid credentials

- **WHEN** un usuario ingresa un email o contraseña inválidos
- **THEN** el sistema SHALL mostrar un mensaje de error "Credenciales inválidas"
- **AND** el sistema SHALL mantener al usuario en la página de login
- **AND** el sistema SHALL registrar el intento fallido en audit_logs

#### Scenario: Login with inactive user account

- **WHEN** un usuario con cuenta desactivada (is_active = false) intenta iniciar sesión
- **THEN** el sistema SHALL mostrar un mensaje de error "Cuenta desactivada"
- **AND** el sistema SHALL impedir el acceso al sistema
- **AND** el sistema SHALL registrar el intento en audit_logs

### Requirement: User session management

El sistema SHALL gestionar sesiones de usuario usando tokens JWT con expiración automática.

#### Scenario: Valid session token

- **WHEN** un usuario con sesión activa realiza una acción en la aplicación
- **THEN** el sistema SHALL validar el token JWT
- **AND** el sistema SHALL permitir la acción si el token es válido

#### Scenario: Expired session token

- **WHEN** un usuario intenta realizar una acción con un token JWT expirado
- **THEN** el sistema SHALL redirigir al usuario a la página de login
- **AND** el sistema SHALL mostrar un mensaje "Sesión expirada, por favor inicie sesión nuevamente"
- **AND** el sistema SHALL limpiar el token del almacenamiento local

#### Scenario: Automatic token refresh

- **WHEN** un usuario está activo en la aplicación y su token está próximo a expirar
- **THEN** el sistema SHALL refrescar automáticamente el token JWT
- **AND** el sistema SHALL mantener la sesión activa sin interrumpir al usuario

### Requirement: User logout

El sistema SHALL permitir a los usuarios cerrar sesión de manera segura.

#### Scenario: Successful logout

- **WHEN** un usuario hace clic en el botón "Cerrar sesión"
- **THEN** el sistema SHALL invalidar el token JWT en Supabase Auth
- **AND** el sistema SHALL limpiar todos los datos de sesión del almacenamiento local
- **AND** el sistema SHALL redirigir al usuario a la página de login
- **AND** el sistema SHALL registrar el logout en audit_logs

### Requirement: Password security

El sistema SHALL almacenar contraseñas de forma segura usando hashing.

#### Scenario: Password hashing on user creation

- **WHEN** un administrador crea un nuevo usuario con una contraseña
- **THEN** el sistema SHALL hashear la contraseña usando el sistema de Supabase Auth
- **AND** el sistema SHALL NUNCA almacenar la contraseña en texto plano
- **AND** el sistema SHALL usar bcrypt con al menos 10 rounds

### Requirement: Login redirects by role

El sistema SHALL redirigir a los usuarios a vistas específicas según su rol después del login.

#### Scenario: Admin user redirect

- **WHEN** un usuario con rol ADMIN inicia sesión exitosamente
- **THEN** el sistema SHALL redirigir al usuario al dashboard principal

#### Scenario: Manager user redirect

- **WHEN** un usuario con rol GERENTE inicia sesión exitosamente
- **THEN** el sistema SHALL redirigir al usuario al Manager Dashboard estratégico

#### Scenario: Technician user redirect

- **WHEN** un usuario con rol TECNICO inicia sesión exitosamente
- **THEN** el sistema SHALL redirigir al usuario a la lista de siniestros asignados

#### Scenario: Ally user redirect

- **WHEN** un usuario con rol ALIADO inicia sesión exitosamente
- **THEN** el sistema SHALL redirigir al usuario al Ally Portal
- **AND** el sistema SHALL mostrar únicamente los siniestros de su organización
