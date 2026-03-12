/**
 * Feature Flags Configuration
 *
 * This file manages feature toggles for gradual rollouts and A/B testing.
 * Features can be enabled/disabled via environment variables or user roles.
 */

export interface FeatureFlags {
  // Dashboard feature flag
  // Controls visibility of the KPI Dashboard
  // Enabled: Users can access /dashboard route
  // Disabled: Dashboard route returns 404 or redirects
  dashboardEnabled: boolean;

  // Additional feature flags for future use
  advancedFilters: boolean;
  exportPdf: boolean;
  realTimeUpdates: boolean;
}

/**
 * Default feature flags for development
 */
const defaultFlags: FeatureFlags = {
  dashboardEnabled: true,
  advancedFilters: false,
  exportPdf: false,
  realTimeUpdates: false,
};

/**
 * Production feature flags
 * These values are used when NODE_ENV === 'production'
 */
const productionFlags: FeatureFlags = {
  dashboardEnabled: import.meta.env.VITE_FEATURE_DASHBOARD === 'true' || false,
  advancedFilters: import.meta.env.VITE_FEATURE_ADVANCED_FILTERS === 'true' || false,
  exportPdf: import.meta.env.VITE_FEATURE_EXPORT_PDF === 'true' || false,
  realTimeUpdates: import.meta.env.VITE_FEATURE_REALTIME === 'true' || false,
};

/**
 * Get current feature flags based on environment
 */
export function getFeatureFlags(): FeatureFlags {
  const isProduction = import.meta.env.PROD;

  if (isProduction) {
    return productionFlags;
  }

  // In development, allow override via localStorage for testing
  const storedFlags = localStorage.getItem('featureFlags');
  if (storedFlags) {
    try {
      return { ...defaultFlags, ...JSON.parse(storedFlags) };
    } catch {
      return defaultFlags;
    }
  }

  return defaultFlags;
}

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return getFeatureFlags()[feature];
}

/**
 * Enable/disable features in development (for testing)
 * Only works in development mode
 */
export function setFeatureFlag(feature: keyof FeatureFlags, enabled: boolean): void {
  if (import.meta.env.PROD) {
    console.warn('Cannot modify feature flags in production');
    return;
  }

  const currentFlags = getFeatureFlags();
  const newFlags = { ...currentFlags, [feature]: enabled };
  localStorage.setItem('featureFlags', JSON.stringify(newFlags));

  // Reload to apply changes
  window.location.reload();
}

/**
 * Reset all feature flags to defaults
 */
export function resetFeatureFlags(): void {
  localStorage.removeItem('featureFlags');
  window.location.reload();
}

// Export singleton instance
export const featureFlags = getFeatureFlags();

export default featureFlags;
