import React from 'react';
import { FeatureToggle } from '../FeatureToggle';
import { Dashboard } from './Dashboard';

/**
 * Dashboard with feature flag wrapper
 * Only renders if dashboard feature is enabled
 */
export const DashboardWithFeatureFlag: React.FC = () => {
  return (
    <FeatureToggle
      feature="dashboardEnabled"
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center max-w-md">
            <h2 className="text-xl font-bold text-slate-100 mb-4">Función No Disponible</h2>
            <p className="text-slate-400 mb-6">
              El Dashboard de KPIs está temporalmente deshabilitado. Por favor, contacte al
              administrador del sistema.
            </p>
          </div>
        </div>
      }
    >
      <Dashboard />
    </FeatureToggle>
  );
};

export default DashboardWithFeatureFlag;
