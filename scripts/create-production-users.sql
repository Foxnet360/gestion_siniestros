-- ============================================================================
-- SCRIPT: Creación de Usuarios de Producción - SGS
-- Fecha: 2026-03-02
-- Descripción: Crea 13 usuarios iniciales para el equipo de CorresSeguros
-- ============================================================================

-- NOTA: Este script usa la función RPC create_user_with_auth que ya existe
-- en la base de datos. Cada usuario se crea en auth.users y public.users.

-- ============================================================================
-- FUNCIONES AUXILIARES
-- ============================================================================

-- Función para generar iniciales desde nombre completo
CREATE OR REPLACE FUNCTION generate_initials(full_name TEXT)
RETURNS TEXT AS $$
DECLARE
    parts TEXT[];
    initials TEXT := '';
    i INT;
BEGIN
    -- Dividir nombre en partes
    parts := string_to_array(full_name, ' ');
    
    -- Tomar primera letra de cada parte
    FOR i IN 1..array_length(parts, 1) LOOP
        IF length(parts[i]) > 0 THEN
            initials := initials || upper(left(parts[i], 1));
        END IF;
    END LOOP;
    
    RETURN initials;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- USUARIOS ADMIN (2)
-- ============================================================================

-- Maryory Espinosa Sánchez - ADMIN
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'indemnizaciones@correseguros.co') THEN
        PERFORM create_user_with_auth(
            'indemnizaciones@correseguros.co',
            'SGS123456',
            'Maryory Espinosa Sánchez',
            'ADMIN',
            'MES'
        );
        RAISE NOTICE 'Usuario creado: Maryory Espinosa Sánchez (ADMIN)';
    ELSE
        RAISE NOTICE 'Usuario ya existe: indemnizaciones@correseguros.co';
    END IF;
END $$;

-- Alejandro Cardona - ADMIN
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'info@correseguros.co') THEN
        PERFORM create_user_with_auth(
            'info@correseguros.co',
            'SGS123456',
            'Alejandro Cardona',
            'ADMIN',
            'AC'
        );
        RAISE NOTICE 'Usuario creado: Alejandro Cardona (ADMIN)';
    ELSE
        RAISE NOTICE 'Usuario ya existe: info@correseguros.co';
    END IF;
END $$;

-- ============================================================================
-- USUARIOS TECNICO (4)
-- ============================================================================

-- Sara Lucía Bedoya Velásquez - TECNICO
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'indemnizaciones1@correseguros.co') THEN
        PERFORM create_user_with_auth(
            'indemnizaciones1@correseguros.co',
            'SGS123456',
            'Sara Lucía Bedoya Velásquez',
            'TECNICO',
            'SLBV'
        );
        RAISE NOTICE 'Usuario creado: Sara Lucía Bedoya Velásquez (TECNICO)';
    ELSE
        RAISE NOTICE 'Usuario ya existe: indemnizaciones1@correseguros.co';
    END IF;
END $$;

-- Sandra Echeverri - TECNICO
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'tecnico.vida@correseguros.co') THEN
        PERFORM create_user_with_auth(
            'tecnico.vida@correseguros.co',
            'SGS123456',
            'Sandra Echeverri',
            'TECNICO',
            'SE'
        );
        RAISE NOTICE 'Usuario creado: Sandra Echeverri (TECNICO)';
    ELSE
        RAISE NOTICE 'Usuario ya existe: tecnico.vida@correseguros.co';
    END IF;
END $$;

-- Gonzalo Duque Restrepo - TECNICO
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'tecnico.jfaseguros@correseguros.co') THEN
        PERFORM create_user_with_auth(
            'tecnico.jfaseguros@correseguros.co',
            'SGS123456',
            'Gonzalo Duque Restrepo',
            'TECNICO',
            'GDR'
        );
        RAISE NOTICE 'Usuario creado: Gonzalo Duque Restrepo (TECNICO)';
    ELSE
        RAISE NOTICE 'Usuario ya existe: tecnico.jfaseguros@correseguros.co';
    END IF;
END $$;

-- Yobani Gomez - TECNICO
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'asistente.jfaseguros@correseguros.co') THEN
        PERFORM create_user_with_auth(
            'asistente.jfaseguros@correseguros.co',
            'SGS123456',
            'Yobani Gomez',
            'TECNICO',
            'YG'
        );
        RAISE NOTICE 'Usuario creado: Yobani Gomez (TECNICO)';
    ELSE
        RAISE NOTICE 'Usuario ya existe: asistente.jfaseguros@correseguros.co';
    END IF;
END $$;

-- ============================================================================
-- USUARIOS GERENTE (7)
-- ============================================================================

-- Luz Elena - GERENTE
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'elenacorreseguros@gmail.com') THEN
        PERFORM create_user_with_auth(
            'elenacorreseguros@gmail.com',
            'SGS123456',
            'Luz Elena',
            'GERENTE',
            'LE'
        );
        RAISE NOTICE 'Usuario creado: Luz Elena (GERENTE)';
    ELSE
        RAISE NOTICE 'Usuario ya existe: elenacorreseguros@gmail.com';
    END IF;
END $$;

-- Manuel Antonio Velasquez León - GERENTE
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'gerencia.comercial@correseguros.co') THEN
        PERFORM create_user_with_auth(
            'gerencia.comercial@correseguros.co',
            'SGS123456',
            'Manuel Antonio Velasquez León',
            'GERENTE',
            'MAVL'
        );
        RAISE NOTICE 'Usuario creado: Manuel Antonio Velasquez León (GERENTE)';
    ELSE
        RAISE NOTICE 'Usuario ya existe: gerencia.comercial@correseguros.co';
    END IF;
END $$;

-- Carlos Enrique Vallejo - GERENTE
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'carlosvallejo@seacompetitivo.com') THEN
        PERFORM create_user_with_auth(
            'carlosvallejo@seacompetitivo.com',
            'SGS123456',
            'Carlos Enrique Vallejo',
            'GERENTE',
            'CEV'
        );
        RAISE NOTICE 'Usuario creado: Carlos Enrique Vallejo (GERENTE)';
    ELSE
        RAISE NOTICE 'Usuario ya existe: carlosvallejo@seacompetitivo.com';
    END IF;
END $$;

-- Claudia Arbelaez - GERENTE
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'procesosyproyectos@correseguros.co') THEN
        PERFORM create_user_with_auth(
            'procesosyproyectos@correseguros.co',
            'SGS123456',
            'Claudia Arbelaez',
            'GERENTE',
            'CA'
        );
        RAISE NOTICE 'Usuario creado: Claudia Arbelaez (GERENTE)';
    ELSE
        RAISE NOTICE 'Usuario ya existe: procesosyproyectos@correseguros.co';
    END IF;
END $$;

-- Luis alberto Gallón - GERENTE
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'director2jfaseguros@correseguros.co') THEN
        PERFORM create_user_with_auth(
            'director2jfaseguros@correseguros.co',
            'SGS123456',
            'Luis alberto Gallón',
            'GERENTE',
            'LAG'
        );
        RAISE NOTICE 'Usuario creado: Luis alberto Gallón (GERENTE)';
    ELSE
        RAISE NOTICE 'Usuario ya existe: director2jfaseguros@correseguros.co';
    END IF;
END $$;

-- Alejandro Uribe Velez - GERENTE
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'auribe@uvseguros.com.co') THEN
        PERFORM create_user_with_auth(
            'auribe@uvseguros.com.co',
            'SGS123456',
            'Alejandro Uribe Velez',
            'GERENTE',
            'AUV'
        );
        RAISE NOTICE 'Usuario creado: Alejandro Uribe Velez (GERENTE)';
    ELSE
        RAISE NOTICE 'Usuario ya existe: auribe@uvseguros.com.co';
    END IF;
END $$;

-- Lisimaco cifuentes - GERENTE
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'lisimacocorreseguros@gmail.com') THEN
        PERFORM create_user_with_auth(
            'lisimacocorreseguros@gmail.com',
            'SGS123456',
            'Lisimaco cifuentes',
            'GERENTE',
            'LC'
        );
        RAISE NOTICE 'Usuario creado: Lisimaco cifuentes (GERENTE)';
    ELSE
        RAISE NOTICE 'Usuario ya existe: lisimacocorreseguros@gmail.com';
    END IF;
END $$;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

DO $$
DECLARE
    v_total_admin INT;
    v_total_tecnico INT;
    v_total_gerente INT;
    v_total INT;
BEGIN
    SELECT COUNT(*) INTO v_total_admin FROM users WHERE role = 'ADMIN';
    SELECT COUNT(*) INTO v_total_tecnico FROM users WHERE role = 'TECNICO';
    SELECT COUNT(*) INTO v_total_gerente FROM users WHERE role = 'GERENTE';
    SELECT COUNT(*) INTO v_total FROM users;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RESUMEN DE USUARIOS CREADOS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ADMIN: % usuarios', v_total_admin;
    RAISE NOTICE 'TECNICO: % usuarios', v_total_tecnico;
    RAISE NOTICE 'GERENTE: % usuarios', v_total_gerente;
    RAISE NOTICE 'TOTAL: % usuarios', v_total;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Contraseña inicial para todos: SGS123456';
    RAISE NOTICE '========================================';
END $$;

-- Eliminar función auxiliar (opcional - descomentar si se desea)
-- DROP FUNCTION IF EXISTS generate_initials(TEXT);
