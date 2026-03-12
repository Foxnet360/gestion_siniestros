import React from 'react';
import { Chart } from 'react-chartjs-2';
import type { Claim } from '../../../types';
import { useTiemposPorFase } from '../../../hooks/reports/useTiemposPorFase';
import { CHART_COLORS, barChartOptions } from '../../../utils/chartConfig';

interface TiemposPorFaseProps {
  claims: Claim[];
}

const TiemposPorFase: React.FC<TiemposPorFaseProps> = ({ claims }) => {
  const tiempos = useTiemposPorFase(claims, new Map());

  const data = {
    labels: tiempos.map(t => `Fase ${t.faseId}: ${t.fase.split(' ')[0]}`),
    datasets: [
      {
        type: 'line' as const,
        label: 'Meta (15 días)',
        data: tiempos.map(() => 15),
        borderColor: '#64748b',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        order: 0,
      },
      {
        type: 'bar' as const,
        label: 'Días promedio',
        data: tiempos.map(t => t.tiempoPromedio),
        backgroundColor: tiempos.map(t => {
          if (t.tiempoPromedio > 20) return CHART_COLORS.danger;
          if (t.tiempoPromedio > 10) return CHART_COLORS.warning;
          return CHART_COLORS.success;
        }),
        borderRadius: 4,
        order: 1,
      }
    ],
  };

  return (
    <div id="chart-tiempos-fase" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Tiempos por Fase del Workflow</h3>

      <div className="h-64">
        <Chart type="bar" data={data as any} options={barChartOptions} />
      </div>

      <div className="mt-4 flex items-center gap-4 text-sm font-medium">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="text-slate-600 dark:text-slate-400">Óptimo (&lt;10 días)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span className="text-slate-600 dark:text-slate-400">Aceptable (10-20 días)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500"></div>
          <span className="text-slate-600 dark:text-slate-400">Crítico (&gt;20 días)</span>
        </div>
      </div>
    </div>
  );
};

export default TiemposPorFase;
