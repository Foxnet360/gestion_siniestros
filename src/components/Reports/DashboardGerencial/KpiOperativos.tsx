import React from 'react';
import { Activity, CheckCircle, Clock, AlertOctagon, Target } from 'lucide-react';
import type { KpisData } from '../../../types/reports';

interface KpiOperativosProps {
  data: KpisData['operativos'];
}

const KpiCard: React.FC<{
  title: string;
  value: number;
  format: 'number' | 'percentage' | 'days';
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, format, icon, color }) => {
  const formatValue = () => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'days':
        return `${Math.round(value)} días`;
      default:
        return value.toLocaleString();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-lg ${color} shadow-sm`}>
          {icon}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatValue()}</p>
      </div>
    </div>
  );
};

const KpiOperativos: React.FC<KpiOperativosProps> = ({ data }) => {
  const kpis = [
    {
      title: 'Siniestros Activos',
      value: data.totalSiniestrosActivos,
      format: 'number' as const,
      icon: <Activity className="w-5 h-5 text-white" />,
      color: 'bg-blue-500',
    },
    {
      title: 'Siniestros Cerrados',
      value: data.totalSiniestrosCerrados,
      format: 'number' as const,
      icon: <CheckCircle className="w-5 h-5 text-white" />,
      color: 'bg-emerald-500',
    },
    {
      title: '% Cerrados en Plazo',
      value: data.porcentajeCerradosEnPlazo,
      format: 'percentage' as const,
      icon: <Target className="w-5 h-5 text-white" />,
      color: 'bg-indigo-500',
    },
    {
      title: 'Tiempo Promedio',
      value: data.tiempoPromedioTotal,
      format: 'days' as const,
      icon: <Clock className="w-5 h-5 text-white" />,
      color: 'bg-amber-500',
    },
    {
      title: '% con Objeción',
      value: data.porcentajeConObjecion,
      format: 'percentage' as const,
      icon: <AlertOctagon className="w-5 h-5 text-white" />,
      color: 'bg-rose-500',
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Indicadores Operativos</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </div>
    </div>
  );
};

export default KpiOperativos;
