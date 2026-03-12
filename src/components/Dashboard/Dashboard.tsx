import React from 'react';
import { DashboardFilters } from './DashboardFilters';
import { OperationalEfficiencySection } from './sections/OperationalEfficiencySection';
import { FinancialMetricsSection } from './sections/FinancialMetricsSection';
import { SLATrackingSection } from './sections/SLATrackingSection';
import { ActionPlanPanel } from './sections/ActionPlanPanel';
import { useKPIs } from '../../hooks/useKPIs';
import { AlertCircle } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { overview, leadTime, tasas, backlog, loading, error, refetch } = useKPIs();

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="bg-slate-800 border border-red-500/50 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-100 mb-2">Error al cargar datos</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header with Filters */}
      <DashboardFilters />

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-[1600px] mx-auto">
          {/* Section 1: Operational Efficiency */}
          <OperationalEfficiencySection
            leadTime={
              leadTime
                ? {
                    average: leadTime.average,
                    trend: [25, 27, 26, 28, 29, 28],
                    target: 30,
                  }
                : undefined
            }
            tasas={
              overview
                ? {
                    desistimiento: overview.tasaDesistimiento,
                    objetados: overview.tasaObjetados,
                    prescritos: overview.tasaPrescritos,
                  }
                : undefined
            }
            isLoading={loading}
          />

          {/* Section 2: Financial Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <FinancialMetricsSection isLoading={loading} />
            </div>

            <div className="lg:col-span-1">
              <ActionPlanPanel isLoading={loading} />
            </div>
          </div>

          {/* Section 3: SLA Tracking */}
          <SLATrackingSection
            backlog={
              backlog && overview
                ? {
                    abiertos: overview.backlogActivos,
                    finalizados: overview.finalizadosCount,
                    total: overview.totalSiniestros,
                  }
                : undefined
            }
            isLoading={loading}
          />
        </div>
      </main>
    </div>
  );
};
