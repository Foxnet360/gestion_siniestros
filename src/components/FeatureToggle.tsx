import React from 'react';
import { isFeatureEnabled } from '../config/featureFlags';

interface FeatureToggleProps {
  feature: 'dashboardEnabled' | 'advancedFilters' | 'exportPdf' | 'realTimeUpdates';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component wrapper that conditionally renders based on feature flag
 * Shows children if feature is enabled, otherwise shows fallback (or null)
 */
export const FeatureToggle: React.FC<FeatureToggleProps> = ({
  feature,
  children,
  fallback = null,
}) => {
  const enabled = isFeatureEnabled(feature);

  if (!enabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Hook to check if a feature is enabled
 */
export function useFeature(
  feature: 'dashboardEnabled' | 'advancedFilters' | 'exportPdf' | 'realTimeUpdates'
): boolean {
  return isFeatureEnabled(feature);
}

export default FeatureToggle;
