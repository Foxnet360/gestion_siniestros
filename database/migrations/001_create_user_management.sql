-- ============================================================================
-- MIGRACIÓN: Sistema de Gestión de Usuarios
-- Descripción: Crea tablas users y audit_logs, modifica claims para soporte de autenticación real
-- Fecha: 2026-03-01
-- ============================================================================

-- ============================================================================
-- 1. TABLA USERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'GERENTE', 'TECNICO', 'ALIADO')),
    initials VARCHAR(10) NOT NULL,
    aliado_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. TABLA AUDIT_LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. MODIFICACIÓN TABLA CLAIMS
-- ============================================================================

-- Agregar columna tecnico_id (mantener tecnico_asignado temporalmente para migración)
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS tecnico_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
-- ============================================================================
-- 4. ÍNDICES
-- ============================================================================

-- Índices para users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_aliado_id ON users(aliado_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Índices para audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id_created_at ON audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Índices para claims (nuevos)
CREATE INDEX IF NOT EXISTS idx_claims_tecnico_id_estado ON claims(tecnico_id, estado_interno);
CREATE INDEX IF NOT EXISTS idx_claims_created_at_estado ON claims(created_at, estado_interno);
CREATE INDEX IF NOT EXISTS idx_claims_aseguradora_fecha ON claims(aseguradora, fecha_ocurrencia);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) - TABLA USERS
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios pueden ver/editar su propio perfil
CREATE POLICY "Users can view and edit own profile" ON users
    FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Política: ADMIN puede ver y editar todos los usuarios
CREATE POLICY "Admin can manage all users" ON users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() AND u.role = 'ADMIN' AND u.is_active = true
        )
    );

-- Política: GERENTE puede ver todos los usuarios (solo lectura)
CREATE POLICY "Manager can view all users" ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() AND u.role = 'GERENTE' AND u.is_active = true
        )
    );

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) - TABLA AUDIT_LOGS
-- ============================================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Política: ADMIN y GERENTE pueden ver todos los audit_logs
CREATE POLICY "Admin and Manager can view all audit logs" ON audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('ADMIN', 'GERENTE') 
            AND u.is_active = true
        )
    );

-- Política: Usuarios pueden ver sus propias acciones
CREATE POLICY "Users can view own audit logs" ON audit_logs
    FOR SELECT
    USING (user_id = auth.uid());

-- Política: Insertar logs (solo a través de funciones/triggers)
CREATE POLICY "Enable insert for authenticated users" ON audit_logs
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- 7. FUNCIÓN PARA AUDITORÍA AUTOMÁTICA
-- ============================================================================

CREATE OR REPLACE FUNCTION log_audit_action(
    p_action VARCHAR,
    p_entity_type VARCHAR,
    p_entity_id VARCHAR,
    p_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. TRIGGER PARA AUDITAR CAMBIOS EN CLAIMS
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_claim_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_audit_action(
            'CREATE',
            'claim',
            NEW.id_softseguros,
            jsonb_build_object('numero_siniestro', NEW.numero_siniestro, 'asegurado', NEW.asegurado)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_audit_action(
            'UPDATE',
            'claim',
            NEW.id_softseguros,
            jsonb_build_object(
                'old_estado', OLD.estado_interno,
                'new_estado', NEW.estado_interno,
                'changed_fields', (
                    SELECT jsonb_object_agg(key, value)
                    FROM jsonb_each(to_jsonb(NEW))
                    WHERE key IN (
                        SELECT key 
                        FROM jsonb_each(to_jsonb(OLD)) AS o(key, val)
                        FULL OUTER JOIN jsonb_each(to_jsonb(NEW)) AS n(key, val) USING (key)
                        WHERE o.val IS DISTINCT FROM n.val
                    )
                )
            )
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_audit_action(
            'DELETE',
            'claim',
            OLD.id_softseguros,
            jsonb_build_object('numero_siniestro', OLD.numero_siniestro, 'asegurado', OLD.asegurado)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_claim_changes_trigger ON claims;
CREATE TRIGGER audit_claim_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON claims
    FOR EACH ROW
    EXECUTE FUNCTION audit_claim_changes();

-- ============================================================================
-- 9. FUNCIÓN PARA CREAR USUARIO EN AMBAS TABLAS
-- ============================================================================

CREATE OR REPLACE FUNCTION create_user_with_auth(
    p_email VARCHAR,
    p_password VARCHAR,
    p_name VARCHAR,
    p_role VARCHAR,
    p_initials VARCHAR,
    p_aliado_id VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Crear usuario en auth.users
    v_user_id := extensions.uuid_generate_v4();
    
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        p_email,
        crypt(p_password, gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object('name', p_name, 'role', p_role),
        NOW(),
        NOW()
    );
    
    -- Crear entrada en public.users
    INSERT INTO users (id, email, name, role, initials, aliado_id, is_active)
    VALUES (v_user_id, p_email, p_name, p_role, p_initials, p_aliado_id, true);
    
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. FUNCIÓN PARA ASIGNAR TÉCNICO A SINIESTRO
-- ============================================================================

CREATE OR REPLACE FUNCTION assign_tecnico_to_claim(
    p_claim_id VARCHAR,
    p_tecnico_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE claims 
    SET tecnico_id = p_tecnico_id,
        tecnico_asignado = (SELECT name FROM users WHERE id = p_tecnico_id)
    WHERE id_softseguros = p_claim_id;
    
    PERFORM log_audit_action(
        'ASSIGN_TECNICO',
        'claim',
        p_claim_id,
        jsonb_build_object('tecnico_id', p_tecnico_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 11. ROW LEVEL SECURITY (RLS) - TABLA CLAIMS
-- ============================================================================

ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- Política: ADMIN y GERENTE pueden ver todos los siniestros
CREATE POLICY "Admin and Manager can view all claims" ON claims
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('ADMIN', 'GERENTE') 
            AND u.is_active = true
        )
    );

-- Política: TECNICO puede ver siniestros asignados a él
CREATE POLICY "Technician can view assigned claims" ON claims
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'TECNICO' 
            AND u.is_active = true
        )
        AND tecnico_id = auth.uid()
    );

-- Política: ALIADO puede ver siniestros de su organización
CREATE POLICY "Ally can view own organization claims" ON claims
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'ALIADO' 
            AND u.is_active = true
            AND u.aliado_id = claims.aliado_origen
        )
    );

-- Política: ADMIN y GERENTE pueden modificar todos los siniestros
CREATE POLICY "Admin and Manager can modify all claims" ON claims
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('ADMIN', 'GERENTE') 
            AND u.is_active = true
        )
    );

-- Política: TECNICO puede modificar siniestros asignados
CREATE POLICY "Technician can modify assigned claims" ON claims
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'TECNICO' 
            AND u.is_active = true
        )
        AND tecnico_id = auth.uid()
    );

-- Política: ALIADO solo puede leer (no modificar) - política de insert/update/delete separada
CREATE POLICY "Ally cannot modify claims" ON claims
    FOR INSERT
    WITH CHECK (false);

CREATE POLICY "Ally cannot update claims" ON claims
    FOR UPDATE
    USING (false);

CREATE POLICY "Ally cannot delete claims" ON claims
    FOR DELETE
    USING (false);

-- ============================================================================
-- NOTAS DE IMPLEMENTACIÓN
-- ============================================================================

/*
1. Ejecutar este script en el SQL Editor de Supabase
2. Verificar que extension pgcrypto esté habilitada (para crypt/gen_salt)
3. Configurar Supabase Auth en el dashboard:
   - Settings > Authentication > Email > Enable Email provider
   - Settings > Authentication > Email > Confirm email = OFF (auto-confirm)
   - Settings > API > JWT Settings > JWT expiry = 86400 (24 horas)

4. Para crear el primer usuario ADMIN:
   SELECT create_user_with_auth(
       'admin@softseguros.com',
       'Admin123!',
       'Administrador Principal',
       'ADMIN',
       'AP'
   );

5. Para migrar técnicos existentes (ejecutar después de que el código esté listo):
   - Usar el script de migración proporcionado en scripts/migrate-tecnicos.ts
*/
