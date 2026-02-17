import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, BarChart3 } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import type { KpisData } from '../../../types/reports';

interface KpiFinancierosProps {
  data: KpisData['financieros'];
}

const KpiCard: React.FC<{
  title: string;
  value: number;
  previousValue?: number;
  format: 'currency' | 'percentage' | 'number';
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, previousValue, format, icon, color }) => {
  const formatValue = () => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString();
    }
  };

  // Calculate variation
  const variation = previousValue && previousValue > 0
    ? ((value - previousValue) / previousValue) * 100
    : 0;

  const isPositive = variation > 0;
  const isSignificant = Math.abs(variation) > 1; // Only show if > 1%

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-lg ${color} shadow-sm`}>
          {icon}
        </div>
        {isSignificant && (
          <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
            }`}>
            {isPositive ? '↑' : '↓'}
            {Math.abs(variation).toFixed(1)}%
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatValue()}</p>
        {previousValue !== undefined && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            vs {formatCurrency(previousValue)}
          </p>
        )}
      </div>
    </div>
  );
};

const KpiFinancieros: React.FC<KpiFinancierosProps> = ({ data }) => {
  const kpis = [
    {
      title: 'Total Reclamado',
      value: data.totalReclamado,
      format: 'currency' as const,
      icon: <DollarSign className="w-5 h-5 text-white" />,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Indemnizado',
      value: data.totalIndemnizado,
      format: 'currency' as const,
      icon: <TrendingDown className="w-5 h-5 text-white" />,
      color: 'bg-emerald-500',
    },
    {
      title: '% Recuperación',
      value: data.porcentajeRecuperacion,
      format: 'percentage' as const,
      icon: <TrendingUp className="w-5 h-5 text-white" />,
      color: 'bg-indigo-500',
    },
    {
      title: 'Valor Promedio',
      value: data.valorPromedioSiniestro,
      format: 'currency' as const,
      icon: <BarChart3 className="w-5 h-5 text-white" />,
      color: 'bg-violet-500',
    },
    {
      title: 'Monto en Riesgo',
      value: data.montoRiesgoPrescripcion,
      format: 'currency' as const,
      icon: <AlertCircle className="w-5 h-5 text-white" />,
      color: 'bg-rose-500',
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Indicadores Financieros</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </div>
    </div>
  );
};

export default KpiFinancieros;
