import React from 'react';
import { GaugeChart } from '../charts/GaugeChart';
import { DonutChart } from '../charts/DonutChart';

interface OperationalEfficiencySectionProps {
  leadTime?: {
    average: number;
    trend: number[];
    target: number;
  };
  tasas?: {
    desistimiento: number;
    objetados: number;
    prescritos: number;
  };
  isLoading?: boolean;
}

export const OperationalEfficiencySection: React.FC<OperationalEfficiencySectionProps> = ({
  leadTime,
  tasas,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
          Indicadores de Eficiencia Operativa
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const leadTimeColor = leadTime && leadTime.average <= leadTime.target ? '#22c55e' : '#ef4444';
  const desistimientoColor = tasas && tasas.desistimiento <= 10 ? '#22c55e' : '#ef4444';

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 uppercase tracking-wider">
        INDICADORES DE EFICIENCIA OPERATIVA
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Lead Time */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm flex items-center justify-center">
          <GaugeChart
            value={leadTime?.average || 0}
            max={Math.max(60, Math.ceil((leadTime?.average || 0) * 1.3))}
            title="CICLO DE RESOLUCIÓN (LEAD TIME)"
            subtitle="DÍAS HÁBILES"
            target={leadTime?.target || 30}
            unit="DÍAS HÁBILES"
            size="md"
          />
        </div>

        {/* Tasa de Desistimiento */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm flex items-center justify-center">
          <DonutChart
            percentage={tasas?.desistimiento || 0}
            title="TASA DE DESISTIMIENTO"
            target={10}
            size="md"
          />
        </div>

        {/* Tasa de Objetados */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm flex items-center justify-center">
          <DonutChart
            percentage={tasas?.objetados || 0}
            title="TASA DE OBJETADOS"
            subtitle="DURANTE EL PERIODO"
            target={5}
            size="md"
          />
        </div>

        {/* Tasa de Prescritos */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm flex items-center justify-center">
          <DonutChart
            percentage={tasas?.prescritos || 0}
            title="TASA DE PRESCRITOS"
            subtitle="HISTÓRICO ACUMULADO"
            target={1}
            size="md"
          />
        </div>
      </div>
    </section>
  );
};
