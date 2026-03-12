-- Normalización de estado_interno en base a estado_softseguros
-- Extrae el último elemento de la cadena separada por guiones ('-') y limpia espacios.

UPDATE claims
SET estado_interno = trim(
    (string_to_array(estado_softseguros, '-'))[array_length(string_to_array(estado_softseguros, '-'), 1)]
)
WHERE estado_softseguros IS NOT NULL 
  AND estado_softseguros != '' 
  AND estado_interno != trim((string_to_array(estado_softseguros, '-'))[array_length(string_to_array(estado_softseguros, '-'), 1)]);
