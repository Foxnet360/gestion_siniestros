import React from 'react';
import { LucideIcon } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface KpiCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  iconColor: string;
  subtitle?: string;
  alert?: boolean;
  format?: 'currency' | 'percentage' | 'number';
  secondaryValue?: number;
  secondaryLabel?: string;
}

/**
 * Tarjeta de KPI individual
 * Muestra una métrica clave con icono y subtítulo
 */
export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor,
  subtitle,
  alert = false,
  format = 'currency',
  secondaryValue,
  secondaryLabel = 'casos',
}) => {
  const formatValue = (val: number): string => {
    switch (format) {
      case 'currency':
        return formatCurrency(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'number':
        return val.toString();
      default:
        return val.toString();
    }
  };

  return (
    <div
      className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm relative overflow-hidden ${alert ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-slate-800' : ''
        }`}
    >
      <div className="absolute right-0 top-0 p-4 opacity-10">
        <Icon className={`w-16 h-16 text-${iconColor}-400`} />
      </div>
      <h3
        className={`text-sm font-medium uppercase tracking-wider ${alert ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'
          }`}
      >
        {title}
      </h3>
      <div className="flex items-baseline gap-2 mt-2">
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatValue(value)}</p>
        {secondaryValue !== undefined && (
          <p className="text-sm font-semibold text-slate-400">
            ({secondaryValue} {secondaryLabel})
          </p>
        )}
      </div>
      <div className={`mt-2 flex items-center text-xs text-${iconColor}-400`}>
        <Icon className="w-3 h-3 mr-1" />
        <span>{subtitle}</span>
      </div>
    </div>
  );
};
