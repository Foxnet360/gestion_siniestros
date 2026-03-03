import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Clock,
  Activity,
  BarChart3,
  Calendar,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useManagerDashboard } from '../../hooks/useManagerDashboard';
import { formatCurrency } from '../../utils/formatters';

const ManagerDashboard: React.FC = () => {
  const {
    kpis,
    profitability,
    trends,
    resolutionTimes,
    forecasts,
    comparative,
    isLoading,
    error,
    refreshData,
  } = useManagerDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-rose-600">
        <AlertCircle className="w-12 h-12 mb-4" />
        <p>{error}</p>
        <button
          onClick={refreshData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Dashboard Gerencial
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Análisis estratégico y métricas clave del negocio
          </p>
        </div>
        <button
          onClick={refreshData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* KPIs Principales */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Reclamado del Mes"
            value={formatCurrency(kpis.reclamadoMes)}
            icon={DollarSign}
            trend={kpis.variacionMes}
            trendLabel="vs mes anterior"
            color="blue"
          />
          <KPICard
            title="Indemnizado del Mes"
            value={formatCurrency(kpis.indemnizadoMes)}
            icon={DollarSign}
            color="emerald"
          />
          <KPICard
            title="Casos Activos"
            value={kpis.casosActivos.toString()}
            icon={Users}
            color="violet"
          />
          <KPICard
            title="Eficiencia"
            value={`${kpis.reclamadoMes > 0 ? Math.round((kpis.indemnizadoMes / kpis.reclamadoMes) * 100) : 0}%`}
            icon={Activity}
            color="amber"
          />
        </div>
      )}

      {/* Gráficos */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Rentabilidad por Aseguradora */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Rentabilidad por Aseguradora
          </h3>
          <div className="space-y-3">
            {profitability.slice(0, 5).map(item => (
              <div key={item.aseguradora} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-300">{item.aseguradora}</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {formatCurrency(item.totalReclamado)}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${Math.min(item.porcentajeRecuperacion, 100)}%`,
                      backgroundColor:
                        item.porcentajeRecuperacion > 80
                          ? '#10b981'
                          : item.porcentajeRecuperacion > 50
                            ? '#f59e0b'
                            : '#ef4444',
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Recuperación: {item.porcentajeRecuperacion.toFixed(1)}%</span>
                  <span>Diferencia: {formatCurrency(item.diferencia)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tiempos de Resolución */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Tiempos de Resolución por Fase
          </h3>
          <div className="space-y-3">
            {resolutionTimes.slice(0, 6).map(item => (
              <div
                key={item.categoria}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg"
              >
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">{item.categoria}</div>
                  <div className="text-sm text-slate-500">{item.casosTotales} casos</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {item.tiempoPromedioDias} días
                  </div>
                  <div className="text-xs text-slate-500">promedio</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla de Tendencias */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Tendencias Mensuales
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Mes
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                  Casos Nuevos
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                  Casos Cerrados
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                  Reclamado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                  Indemnizado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {trends
                .slice(-6)
                .reverse()
                .map(trend => (
                  <tr key={trend.mes}>
                    <td className="px-4 py-3 text-slate-900 dark:text-white">{trend.mes}</td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                      {trend.casosNuevos}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                      {trend.casosCerrados}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">
                      {formatCurrency(trend.montoReclamado)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(trend.montoIndemnizado)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proyecciones */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Proyecciones (Próximos 3 meses)
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {forecasts.map(forecast => (
            <div
              key={forecast.mes}
              className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-center"
            >
              <div className="text-sm text-slate-500 mb-1">{forecast.mes}</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(forecast.proyectado)}
              </div>
              <div className="text-xs text-blue-600 mt-1">Proyectado</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Componente KPICard
interface KPICardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  color: 'blue' | 'emerald' | 'violet' | 'amber';
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color,
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
    violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
          {trend !== undefined && (
            <div
              className={`flex items-center gap-1 mt-2 text-sm ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
            >
              {trend >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{Math.abs(trend).toFixed(1)}%</span>
              <span className="text-slate-400">{trendLabel}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
