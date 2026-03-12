import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number;
  unit?: string;
  target?: number;
  targetDirection?: 'lower' | 'higher';
  description?: string;
  loading?: boolean;
}

/**
 * KPI Card component with visual indicators for targets
 */
export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit = '',
  target,
  targetDirection = 'lower',
  description,
  loading = false,
}) => {
  // Determine if target is met
  const isTargetMet = React.useMemo(() => {
    if (target === undefined) return null;

    if (targetDirection === 'lower') {
      return value <= target;
    }
    return value >= target;
  }, [value, target, targetDirection]);

  // Format value based on magnitude
  const formattedValue = React.useMemo(() => {
    if (unit === '%') {
      return `${value.toFixed(2)}%`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toFixed(2);
  }, [value, unit]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 animate-pulse shadow-sm">
        <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
        <div className="h-8 bg-slate-100 dark:bg-slate-700 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all duration-200 shadow-sm border-b-2 border-b-transparent hover:border-b-blue-500">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">{title}</h3>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-bold ${
                isTargetMet === true
                  ? 'text-emerald-400'
                  : isTargetMet === false
                    ? 'text-rose-600 dark:text-rose-400'
                   : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {formattedValue}
            </span>
            {unit && unit !== '%' && <span className="text-sm text-slate-500">{unit}</span>}
          </div>

          {target !== undefined && (
            <div className="flex items-center gap-2 mt-2">
              {isTargetMet ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-400">
                    Meta cumplida ({targetDirection === 'lower' ? '≤' : '≥'} {target}
                    {unit})
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span className="text-xs text-rose-400">
                    Meta no cumplida ({targetDirection === 'lower' ? '≤' : '≥'} {target}
                    {unit})
                  </span>
                </>
              )}
            </div>
          )}

          {description && <p className="text-xs text-slate-500 mt-2">{description}</p>}
        </div>

        <div className="ml-4">
          {isTargetMet === true && <TrendingUp className="w-8 h-8 text-emerald-400" />}
          {isTargetMet === false && targetDirection === 'lower' && (
            <TrendingUp className="w-8 h-8 text-rose-400" />
          )}
          {isTargetMet === false && targetDirection === 'higher' && (
            <TrendingDown className="w-8 h-8 text-rose-400" />
          )}
        </div>
      </div>
    </div>
  );
};

export default KPICard;
