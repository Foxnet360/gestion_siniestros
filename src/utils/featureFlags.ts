/**
 * Feature Flag Utility
 *
 * Provides utilities for checking feature flags, specifically for the
 * AUTO_FOLLOWUP_ENABLED feature flag.
 *
 * @module utils/featureFlags
 */

import { supabase } from '../lib/supabase';

export interface FeatureFlags {
  AUTO_FOLLOWUP_ENABLED: boolean;
  AUTO_FOLLOWUP_BETA_USERS: string[];
  AUTO_FOLLOWUP_ROLLOUT_PERCENTAGE: number;
}

/**
 * Checks if a feature flag is enabled
 *
 * @param flagName - Name of the feature flag
 * @param userId - Optional user ID for user-specific feature flags
 * @returns Whether the feature is enabled
 */
export async function isFeatureEnabled(
  flagName: keyof FeatureFlags,
  userId?: string
): Promise<boolean> {
  try {
    // For client-side, we might want to check local storage first for cached value
    const cachedValue = getCachedFeatureFlag(flagName);
    if (cachedValue !== null) {
      return cachedValue;
    }

    // Check via database function
    const { data, error } = await supabase.rpc('is_feature_enabled', {
      feature_name: flagName,
      user_id: userId,
    });

    if (error) {
      console.warn('Error checking feature flag:', error);
      // Default to false on error
      return false;
    }

    // Cache the result
    cacheFeatureFlag(flagName, data);

    return data;
  } catch (err) {
    console.error('Error in isFeatureEnabled:', err);
    return false;
  }
}

/**
 * Gets all feature flags
 *
 * @returns Object with all feature flags
 */
export async function getFeatureFlags(): Promise<Partial<FeatureFlags>> {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('config_value')
      .eq('config_key', 'feature_flags')
      .single();

    if (error || !data) {
      console.warn('Error fetching feature flags:', error);
      return {
        AUTO_FOLLOWUP_ENABLED: false,
        AUTO_FOLLOWUP_BETA_USERS: [],
        AUTO_FOLLOWUP_ROLLOUT_PERCENTAGE: 0,
      };
    }

    return data.config_value as FeatureFlags;
  } catch (err) {
    console.error('Error in getFeatureFlags:', err);
    return {
      AUTO_FOLLOWUP_ENABLED: false,
    };
  }
}

/**
 * Updates a feature flag (ADMIN only)
 *
 * @param flagName - Name of the feature flag to update
 * @param value - New value for the flag
 * @returns Success status
 */
export async function updateFeatureFlag(
  flagName: keyof FeatureFlags,
  value: boolean | string[] | number
): Promise<boolean> {
  try {
    // Get current flags
    const { data: currentData, error: fetchError } = await supabase
      .from('app_config')
      .select('config_value')
      .eq('config_key', 'feature_flags')
      .single();

    if (fetchError || !currentData) {
      console.error('Error fetching current feature flags:', fetchError);
      return false;
    }

    // Update specific flag
    const updatedFlags = {
      ...currentData.config_value,
      [flagName]: value,
    };

    // Save back
    const { error: updateError } = await supabase
      .from('app_config')
      .update({ config_value: updatedFlags })
      .eq('config_key', 'feature_flags');

    if (updateError) {
      console.error('Error updating feature flag:', updateError);
      return false;
    }

    // Clear cache
    clearFeatureFlagCache(flagName);

    return true;
  } catch (err) {
    console.error('Error in updateFeatureFlag:', err);
    return false;
  }
}

// Simple in-memory cache for feature flags
const featureFlagCache: Map<string, { value: boolean; timestamp: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedFeatureFlag(flagName: string): boolean | null {
  const cached = featureFlagCache.get(flagName);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }
  return null;
}

function cacheFeatureFlag(flagName: string, value: boolean): void {
  featureFlagCache.set(flagName, {
    value,
    timestamp: Date.now(),
  });
}

function clearFeatureFlagCache(flagName: string): void {
  featureFlagCache.delete(flagName);
}

/**
 * Hook for checking if auto-followup is enabled
 * Convenience function for the main feature flag
 *
 * @param userId - Optional user ID
 * @returns Whether auto-followup is enabled
 */
export async function isAutoFollowupEnabled(userId?: string): Promise<boolean> {
  return isFeatureEnabled('AUTO_FOLLOWUP_ENABLED', userId);
}
