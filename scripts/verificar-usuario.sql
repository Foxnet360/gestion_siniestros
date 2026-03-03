-- Verificar si el usuario se creó correctamente
SELECT 'Búsqueda en auth.users:' as ubicacion, id, email 
FROM auth.users 
WHERE email = 'indemnizaciones@correseguros.co';

SELECT 'Búsqueda en public.users:' as ubicacion, id, email, name, role
FROM users 
WHERE email = 'indemnizaciones@correseguros.co';

-- Si ambas consultas devuelven resultados, el usuario existe
-- Si devuelven vacío, ejecuta el INSERT de nuevo
