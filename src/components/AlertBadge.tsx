import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, Clock, AlertOctagon } from 'lucide-react';

export type AlertLevel =
  | 'normal'
  | 'warning'
  | 'critical'
  | 'legal_stagnation_warning'
  | 'legal_stagnation_critical'
  | 'resolved';

interface AlertBadgeProps {
  level: AlertLevel;
  daysRemaining?: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Componente visual para mostrar el nivel de alerta de un siniestro
 *
 * @example
 * <AlertBadge level="critical" daysRemaining={15} />
 * <AlertBadge level="warning" size="sm" showText={false} />
 */
export const AlertBadge: React.FC<AlertBadgeProps> = ({
  level,
  daysRemaining,
  size = 'md',
  showIcon = true,
  showText = true,
  className = '',
  onClick,
}) => {
  const getAlertConfig = (alertLevel: AlertLevel) => {
    switch (alertLevel) {
      case 'critical':
        return {
          icon: AlertOctagon,
          label: daysRemaining !== undefined && daysRemaining <= 0 ? 'VENCIDO' : 'CRÍTICO',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          textColor: 'text-red-700 dark:text-red-300',
          borderColor: 'border-red-300 dark:border-red-700',
          iconColor: 'text-red-600 dark:text-red-400',
          tooltip:
            daysRemaining !== undefined
              ? `Prescripción vence en ${daysRemaining} días`
              : 'Requiere atención inmediata',
        };

      case 'warning':
        return {
          icon: AlertTriangle,
          label: 'ADVERTENCIA',
          bgColor: 'bg-amber-100 dark:bg-amber-900/30',
          textColor: 'text-amber-700 dark:text-amber-300',
          borderColor: 'border-amber-300 dark:border-amber-700',
          iconColor: 'text-amber-600 dark:text-amber-400',
          tooltip:
            daysRemaining !== undefined
              ? `Prescripción vence en ${daysRemaining} días`
              : 'Requiere atención pronto',
        };

      case 'legal_stagnation_critical':
        return {
          icon: AlertCircle,
          label: 'ESTANCAMIENTO',
          bgColor: 'bg-rose-100 dark:bg-rose-900/30',
          textColor: 'text-rose-700 dark:text-rose-300',
          borderColor: 'border-rose-300 dark:border-rose-700',
          iconColor: 'text-rose-600 dark:text-rose-400',
          tooltip: 'Proceso jurídico estancado - Cierre inminente',
        };

      case 'legal_stagnation_warning':
        return {
          icon: Clock,
          label: 'ESTANCAMIENTO',
          bgColor: 'bg-orange-100 dark:bg-orange-900/30',
          textColor: 'text-orange-700 dark:text-orange-300',
          borderColor: 'border-orange-300 dark:border-orange-700',
          iconColor: 'text-orange-600 dark:text-orange-400',
          tooltip: 'Proceso jurídico estancado',
        };

      case 'resolved':
        return {
          icon: CheckCircle,
          label: 'RESUELTO',
          bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
          textColor: 'text-emerald-700 dark:text-emerald-300',
          borderColor: 'border-emerald-300 dark:border-emerald-700',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          tooltip: 'Siniestro finalizado',
        };

      case 'normal':
      default:
        return {
          icon: CheckCircle,
          label: 'NORMAL',
          bgColor: 'bg-slate-100 dark:bg-slate-800',
          textColor: 'text-slate-600 dark:text-slate-400',
          borderColor: 'border-slate-300 dark:border-slate-600',
          iconColor: 'text-slate-500 dark:text-slate-400',
          tooltip: 'Sin alertas activas',
        };
    }
  };

  const config = getAlertConfig(level);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Si es normal y no tiene onClick, mostrar versión minimalista o null
  if (level === 'normal' && !onClick) {
    return null;
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        border transition-all duration-200
        ${sizeClasses[size]}
        ${config.bgColor}
        ${config.textColor}
        ${config.borderColor}
        ${onClick ? 'cursor-pointer hover:opacity-80 active:scale-95' : ''}
        ${className}
      `}
      onClick={onClick}
      title={config.tooltip}
    >
      {showIcon && <Icon className={`${iconSizes[size]} ${config.iconColor} flex-shrink-0`} />}
      {showText && <span>{config.label}</span>}
    </span>
  );
};

/**
 * Versión simplificada solo con el ícono (para tablas densas)
 */
export const AlertIcon: React.FC<{
  level: AlertLevel;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}> = ({ level, size = 'md', className = '', onClick }) => {
  const getIconConfig = (alertLevel: AlertLevel) => {
    switch (alertLevel) {
      case 'critical':
        return { icon: AlertOctagon, color: 'text-red-600 dark:text-red-400' };
      case 'warning':
        return { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400' };
      case 'legal_stagnation_critical':
        return { icon: AlertCircle, color: 'text-rose-600 dark:text-rose-400' };
      case 'legal_stagnation_warning':
        return { icon: Clock, color: 'text-orange-600 dark:text-orange-400' };
      case 'resolved':
        return { icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400' };
      case 'normal':
      default:
        return { icon: CheckCircle, color: 'text-slate-400 dark:text-slate-500' };
    }
  };

  const { icon: Icon, color } = getIconConfig(level);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  if (level === 'normal') {
    return null;
  }

  return (
    <Icon
      className={`
        ${sizeClasses[size]} 
        ${color} 
        ${onClick ? 'cursor-pointer hover:opacity-80' : ''}
        ${className}
      `}
      onClick={onClick}
    />
  );
};

/**
 * Contador de alertas por nivel
 */
export const AlertCounter: React.FC<{
  counts: Record<AlertLevel, number>;
  size?: 'sm' | 'md';
  className?: string;
}> = ({ counts, size = 'md', className = '' }) => {
  const total = Object.values(counts).reduce((a: number, b: number) => a + b, 0);

  if (total === 0) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 ${className}`}
      >
        <CheckCircle className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
        <span className={size === 'sm' ? 'text-sm' : 'text-base'}>Sin alertas</span>
      </span>
    );
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {counts.critical > 0 && (
        <span
          className={`inline-flex items-center gap-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full ${sizeClasses[size]}`}
        >
          <AlertOctagon className="w-3 h-3" />
          {counts.critical}
        </span>
      )}
      {counts.warning > 0 && (
        <span
          className={`inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full ${sizeClasses[size]}`}
        >
          <AlertTriangle className="w-3 h-3" />
          {counts.warning}
        </span>
      )}
      {(counts.legal_stagnation_critical || 0) > 0 && (
        <span
          className={`inline-flex items-center gap-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-full ${sizeClasses[size]}`}
        >
          <AlertCircle className="w-3 h-3" />
          {counts.legal_stagnation_critical}
        </span>
      )}
      {(counts.legal_stagnation_warning || 0) > 0 && (
        <span
          className={`inline-flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full ${sizeClasses[size]}`}
        >
          <Clock className="w-3 h-3" />
          {counts.legal_stagnation_warning}
        </span>
      )}
    </div>
  );
};

export default AlertBadge;
