-- Migration: Add feature flag for auto-followup calculation
-- Created: 2026-03-07

-- Add feature flag configuration
INSERT INTO app_config (config_key, config_value, description, updated_by) VALUES
('feature_flags', '{
    "AUTO_FOLLOWUP_ENABLED": false,
    "AUTO_FOLLOWUP_BETA_USERS": [],
    "AUTO_FOLLOWUP_ROLLOUT_PERCENTAGE": 0,
    "description": "Feature flags para funcionalidades experimentales"
}'::jsonb, 'Feature flags del sistema', 'system')
ON CONFLICT (config_key) DO UPDATE 
SET config_value = EXCLUDED.config_value,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Add comment explaining the feature flag
COMMENT ON TABLE app_config IS 'Tabla de configuración incluyendo feature flags';

-- Create function to check feature flag status
CREATE OR REPLACE FUNCTION is_feature_enabled(feature_name TEXT, user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    feature_flags JSONB;
    enabled BOOLEAN;
    beta_users UUID[];
    rollout_percentage INTEGER;
BEGIN
    -- Get feature flags configuration
    SELECT config_value INTO feature_flags
    FROM app_config
    WHERE config_key = 'feature_flags';
    
    IF feature_flags IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if feature is globally enabled
    enabled := COALESCE((feature_flags->>feature_name)::BOOLEAN, false);
    
    -- If globally enabled, check rollout percentage
    IF enabled THEN
        rollout_percentage := COALESCE((feature_flags->>'AUTO_FOLLOWUP_ROLLOUT_PERCENTAGE')::INTEGER, 0);
        
        -- If user is specified, check if in beta list or percentage-based rollout
        IF user_id IS NOT NULL THEN
            beta_users := ARRAY(SELECT jsonb_array_elements_text(feature_flags->'AUTO_FOLLOWUP_BETA_USERS')::UUID);
            
            -- User is in beta list
            IF user_id = ANY(beta_users) THEN
                RETURN true;
            END IF;
            
            -- Percentage-based rollout using user_id hash
            IF rollout_percentage > 0 THEN
                RETURN (abs(('x' || md5(user_id::TEXT))::BIT(32)::INTEGER) % 100) < rollout_percentage;
            END IF;
        END IF;
        
        -- Feature enabled but user not in rollout
        IF rollout_percentage < 100 THEN
            RETURN false;
        END IF;
    END IF;
    
    RETURN enabled;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_feature_enabled IS 'Verifica si una feature flag está habilitada para un usuario específico';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_feature_enabled(TEXT, UUID) TO authenticated;

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Feature flag AUTO_FOLLOWUP_ENABLED created successfully (default: false)';
    RAISE NOTICE 'Use UPDATE app_config SET config_value = jsonb_set(config_value, ''{AUTO_FOLLOWUP_ENABLED}'', ''true'') WHERE config_key = ''feature_flags'' to enable globally';
END $$;
