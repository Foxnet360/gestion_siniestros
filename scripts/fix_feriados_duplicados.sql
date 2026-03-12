-- Fix para error de duplicados en feriados_colombia
-- Ejecutar si aparece el error: ON CONFLICT DO UPDATE command cannot affect row a second time

-- 1. Limpiar duplicados si existen
DELETE FROM feriados_colombia WHERE fecha = '2025-06-30';

-- 2. Insertar el feriado correcto (Sagrado Corazón y San Pedro y San Pablo caen el mismo día en 2025)
INSERT INTO feriados_colombia (fecha, nombre, tipo, es_puente, anio) VALUES
('2025-06-30', 'Sagrado Corazón y San Pedro y San Pablo', 'religioso', TRUE, 2025)
ON CONFLICT (fecha) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    tipo = EXCLUDED.tipo,
    es_puente = EXCLUDED.es_puente,
    anio = EXCLUDED.anio;

-- Verificar que no hay duplicados
SELECT fecha, COUNT(*) as cantidad 
FROM feriados_colombia 
GROUP BY fecha 
HAVING COUNT(*) > 1;

-- Si la consulta anterior retorna 0 filas, el problema está solucionado
