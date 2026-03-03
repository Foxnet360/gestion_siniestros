import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import type { Claim } from '../../../types';
import type { ReportFilters } from '../../../types/reports';

// Helper para parsear fechas correctamente evitando problemas de zona horaria
const parseDate = (dateStr: string): Date => {
  // Si la fecha viene en formato YYYY-MM-DD (sin hora), interpretarla como fecha local
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  // Si la fecha viene con timezone UTC (ej: "2023-09-13 00:00:00+00" o "2023-09-13T00:00:00Z")
  // extraer solo la parte de la fecha y tratarla como fecha local
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?([+-]\d{2}:?\d{2}|Z)$/.test(dateStr)) {
    const datePart = dateStr.substring(0, 10);
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateStr);
};
import { CHART_COLORS, barChartOptions, lineChartOptions } from '../../../utils/chartConfig';
import { registerChartJS } from '../../../utils/chartConfig';

// Register Chart.js components
registerChartJS();

interface TrendChartsProps {
  claims: Claim[];
  filters: ReportFilters;
}

const TrendCharts: React.FC<TrendChartsProps> = ({ claims, filters }) => {
  // Filter claims
  const filteredClaims = useMemo(() => {
    return claims.filter(claim => {
      if (filters.ramo.length > 0 && !filters.ramo.includes(claim.ramo)) return false;
      if (filters.aseguradora.length > 0 && !filters.aseguradora.includes(claim.aseguradora))
        return false;
      if (filters.tecnico.length > 0 && !filters.tecnico.includes(claim.tecnico_asignado))
        return false;
      return true;
    });
  }, [claims, filters]);

  // Get last 6 months data
  const sixMonthsData = useMemo(() => {
    const months: {
      label: string;
      reclamado: number;
      indemnizado: number;
      activos: number;
      cerrados: number;
    }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthLabel = monthStart.toLocaleDateString('es-ES', {
        month: 'short',
        year: '2-digit',
      });

      const monthClaims = filteredClaims.filter(c => {
        const date = c.fecha_aviso ? parseDate(c.fecha_aviso) : null;
        return date && date >= monthStart && date <= monthEnd;
      });

      const reclamado = monthClaims.reduce((sum, c) => sum + (c.monto_reclamo || 0), 0);
      const indemnizado = monthClaims
        .filter(c => c.finalizado)
        .reduce((sum, c) => sum + (c.valor_indemnizacion || 0), 0);
      const activos = monthClaims.filter(c => !c.finalizado).length;
      const cerrados = monthClaims.filter(c => c.finalizado).length;

      months.push({ label: monthLabel, reclamado, indemnizado, activos, cerrados });
    }

    return months;
  }, [filteredClaims]);

  // Bar chart data (Reclamado vs Indemnizado)
  const barData = {
    labels: sixMonthsData.map(d => d.label),
    datasets: [
      {
        label: 'Reclamado',
        data: sixMonthsData.map(d => d.reclamado / 1000000), // Convert to millions
        backgroundColor: CHART_COLORS.accent1,
        borderRadius: 4,
      },
      {
        label: 'Indemnizado',
        data: sixMonthsData.map(d => d.indemnizado / 1000000),
        backgroundColor: CHART_COLORS.accent2,
        borderRadius: 4,
      },
    ],
  };

  // Line chart data (Activos vs Cerrados)
  const lineData = {
    labels: sixMonthsData.map(d => d.label),
    datasets: [
      {
        label: 'Activos',
        data: sixMonthsData.map(d => d.activos),
        borderColor: CHART_COLORS.accent3,
        backgroundColor: CHART_COLORS.accent3 + '20',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Cerrados',
        data: sixMonthsData.map(d => d.cerrados),
        borderColor: CHART_COLORS.accent2,
        backgroundColor: CHART_COLORS.accent2 + '20',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
        Tendencias (Últimos 6 meses)
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          id="chart-reclamado-indemnizado"
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm"
        >
          <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">
            Reclamado vs Indemnizado (Millones COP)
          </h4>
          <div className="h-64">
            <Bar data={barData} options={barChartOptions} />
          </div>
        </div>

        <div
          id="chart-evolucion-casos"
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm"
        >
          <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">
            Evolución de Casos
          </h4>
          <div className="h-64">
            <Line data={lineData} options={lineChartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendCharts;
