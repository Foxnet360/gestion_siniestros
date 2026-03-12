import React, { useEffect } from 'react';
import { DashboardFilters } from './DashboardFilters';
import { OperationalEfficiencySection } from './sections/OperationalEfficiencySection';
import { FinancialMetricsSection } from './sections/FinancialMetricsSection';
import { SLATrackingSection } from './sections/SLATrackingSection';
import { ActionPlanPanel } from './sections/ActionPlanPanel';
import { useKPIs } from '../../hooks/useKPIs';
import { AlertCircle } from 'lucide-react';
import { DashboardFiltersProvider } from '../../context/DashboardFilters/DashboardFiltersContext';

import { useDashboardFilters } from '../../context/DashboardFilters/DashboardFiltersContext';

import { useClaims } from '../../context/ClaimsContext';
import { useFilterOptions } from '../../hooks/useFilters';

const DashboardContent: React.FC = () => {
  const { filters } = useDashboardFilters();
  const { claims } = useClaims();
  const options = useFilterOptions(claims);
  
  // Convert dashboard FilterState to KpiService KPIFilters
  const kpiFilters = React.useMemo(() => ({
    aseguradora: filters.aseguradora || undefined,
    ramo: filters.ramo.length > 0 ? filters.ramo[0] : undefined, // Currently KpiService takes a single string
    vendedor: filters.vendedor || undefined,
    tecnico: filters.tecnico || undefined,
    asegurado: filters.asegurado || undefined,
    fechaDesde: filters.dateRange.start?.toISOString().split('T')[0],
    fechaHasta: filters.dateRange.end?.toISOString().split('T')[0],
  }), [filters]);

  const {
    overview,
    leadTime,
    tasas,
    backlog,
    followUpMetrics,
    frecuencia,
    severidad,
    loading,
    error,
    refetch,
  } = useKPIs(kpiFilters);

  // Debug logging
  useEffect(() => {
    console.log('Dashboard Data:', {
      overview,
      leadTime,
      tasas,
      backlog,
      followUpMetrics,
      frecuencia,
      severidad,
      loading,
      error,
    });
  }, [overview, leadTime, tasas, backlog, followUpMetrics, frecuencia, severidad, loading, error]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 border border-red-500/50 rounded-xl p-8 max-w-md text-center shadow-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Error al cargar datos</h2>
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Header with Filters */}
      <DashboardFilters 
        aseguradoras={options.aseguradoras}
        ramos={options.ramos}
        vendedores={options.vendedores}
        tecnicos={options.tecnicos}
        asegurados={options.asegurados}
      />

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-[1600px] mx-auto">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              CUADRO DE MANDO DE SINIESTROS DE SEGUROS
            </h1>
            <p className="text-slate-400 mt-1">Panel de control de KPIs y métricas operativas</p>
          </div>

          {/* Debug Info */}
          {!loading && overview && (
            <div className="mb-4 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-500 dark:text-slate-400 shadow-sm">
              <div>Lead Time: {overview.leadTimeAvg} días</div>
              <div>Tasa Desistimiento: {overview.tasaDesistimiento}%</div>
              <div>Tasa Objetados: {overview.tasaObjetados}%</div>
              <div>Tasa Prescritos: {overview.tasaPrescritos}%</div>
              <div>Backlog Activos: {overview.backlogActivos}</div>
            </div>
          )}

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
          <FinancialMetricsSection
            frecuencia={frecuencia}
            severidad={severidad}
            hasHistoricalData={frecuencia?.hasHistoricalData || false}
            isLoading={loading}
          />

          {/* Section 3: SLA Tracking */}
          <SLATrackingSection
            backlog={
              backlog && overview
                ? {
                    abiertos: overview.backlogActivos,
                    finalizados: overview.finalizadosCount,
                    total: overview.totalSiniestros,
                    byStage: backlog.byStage,
                  }
                : undefined
            }
            isLoading={loading}
          />

{/* Section 4: Action Plan - Hidden as requested
          <div className="mt-8">
            <ActionPlanPanel isLoading={loading} />
          </div>
          */}
        </div>
      </main>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  return (
    <DashboardFiltersProvider>
      <DashboardContent />
    </DashboardFiltersProvider>
  );
};

export default Dashboard;
