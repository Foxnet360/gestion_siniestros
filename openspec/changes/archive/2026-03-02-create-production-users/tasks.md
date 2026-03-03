## 1. Preparación del Script SQL

- [x] 1.1 Verificar que la función RPC `create_user_with_auth` existe en Supabase
- [x] 1.2 Validar estructura de la tabla `users` y `auth.users`
- [x] 1.3 Preparar lista de usuarios con iniciales calculadas

## 2. Creación del Script SQL

- [x] 2.1 Crear archivo `scripts/create-production-users.sql`
- [x] 2.2 Implementar lógica idempotente (verificar si usuario existe antes de crear)
- [x] 2.3 Agregar llamadas a `create_user_with_auth` para los 2 usuarios ADMIN
- [x] 2.4 Agregar llamadas a `create_user_with_auth` para los 4 usuarios TECNICO
- [x] 2.5 Agregar llamadas a `create_user_with_auth` para los 7 usuarios GERENTE
- [x] 2.6 Incluir comentarios identificando cada grupo de usuarios

## 3. Validación del Script

- [x] 3.1 Revisar sintaxis SQL del script
- [x] 3.2 Verificar que todos los emails sean válidos
- [x] 3.3 Confirmar que las iniciales estén correctamente calculadas
- [x] 3.4 Validar que el script maneje adecuadamente duplicados

## 4. Ejecución y Verificación

- [ ] 4.1 Ejecutar script en ambiente de desarrollo/pruebas
- [ ] 4.2 Verificar que se crearon los 13 usuarios en tabla `users`
- [ ] 4.3 Verificar que se crearon los 13 usuarios en `auth.users`
- [ ] 4.4 Confirmar roles asignados correctamente
- [ ] 4.5 Probar login con al menos 3 usuarios (uno de cada rol)
- [ ] 4.6 Verificar que contraseña "SGS123456" funciona

## 5. Documentación

- [x] 5.1 Crear nota de ejecución para producción
- [x] 5.2 Documentar procedimiento de notificación a usuarios
- [x] 5.3 Incluir instrucciones de rollback (desactivación de usuarios)
