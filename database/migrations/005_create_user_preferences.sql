-- Migration: Create user_preferences table for notification settings
-- Created: 2026-03-07

CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_settings JSONB NOT NULL DEFAULT '{
        "emailEnabled": true,
        "dailyDigest": true,
        "digestFrequency": "daily",
        "criticalOverride": true
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: Only one record per user
    CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id 
    ON user_preferences(user_id);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can view their own preferences
CREATE POLICY "Users can view own preferences"
    ON user_preferences
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
    ON user_preferences
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
    ON user_preferences
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_user_preferences_timestamp
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_preferences_updated_at();

-- Comments
COMMENT ON TABLE user_preferences IS 'Preferencias de configuración por usuario';
COMMENT ON COLUMN user_preferences.notification_settings IS 'Configuración de notificaciones (JSONB)';

-- Insert default preferences for existing users (optional migration)
-- Uncomment if you want to create default records for all existing users
/*
INSERT INTO user_preferences (user_id, notification_settings)
SELECT id, '{
    "emailEnabled": true,
    "dailyDigest": true,
    "digestFrequency": "daily",
    "criticalOverride": true
}'::jsonb
FROM users
ON CONFLICT (user_id) DO NOTHING;
*/
