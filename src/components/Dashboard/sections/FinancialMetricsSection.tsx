import React from 'react';
import { TimelineChart } from '../charts/TimelineChart';
import { VerticalBarChart } from '../charts/VerticalBarChart';
import { AlertTriangle } from 'lucide-react';

interface FinancialMetricsSectionProps {
  frecuencia?: {
    current: number;
    monthly: Array<{
      month: string;
      value: number;
    }>;
  } | null;
  severidad?: Array<{
    ramo: string;
    value: number;
  }>;
  hasHistoricalData?: boolean;
  isLoading?: boolean;
}

export const FinancialMetricsSection: React.FC<FinancialMetricsSectionProps> = ({
  frecuencia,
  severidad,
  hasHistoricalData = false,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <section className="mb-8">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 uppercase tracking-wider">
          GESTIÓN TÉCNICA Y FINANCIERA
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl animate-pulse" />
          <div className="h-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl animate-pulse" />
        </div>
      </section>
    );
  }

  // Prepare data for charts
  const frecuenciaData =
    frecuencia?.monthly?.map(item => ({
      label: item.month,
      value: item.value,
    })) || [];

  const severidadData =
    severidad?.map(item => ({
      label: item.ramo,
      value: item.severidad || 0,
    })) || [];

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 uppercase tracking-wider">
        GESTIÓN TÉCNICA Y FINANCIERA
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Frecuencia de Siniestralidad */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <TimelineChart
            data={frecuenciaData}
            title="FRECUENCIA DE SINIESTRALIDAD"
            color="#3b82f6"
            height={200}
            suffix=""
          />
          <p className="text-xs text-slate-500 mt-2">DESGLOSO ARS ÚLTIMO AÑO ÚLTIMOS 3 MESES</p>

          {!hasHistoricalData && (
            <div className="flex items-center gap-2 mt-3 text-yellow-500">
              <AlertTriangle size={16} />
              <span className="text-xs">GENERAR DATOS HISTÓRICOS ÚLTIMOS 3 MESES</span>
            </div>
          )}
        </div>

        {/* Severidad por Ramo */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              SEVERIDAD POR RAMO
            </h3>
          </div>
          <VerticalBarChart data={severidadData} height={200} />
          <p className="text-xs text-slate-500 mt-2">
            DESGLOSADO POR RAM/TRAER DE TIPO DE SINIESTRO SS
          </p>
          <div className="flex items-center gap-2 mt-3 text-yellow-500">
            <AlertTriangle size={16} />
            <span className="text-xs">
              CREAR LISTA DESPLEGABLE POR AMPARO (EXTRAER DE TIPO DE SINIESTRO SS)
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
