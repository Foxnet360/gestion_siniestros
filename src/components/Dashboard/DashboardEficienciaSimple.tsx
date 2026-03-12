import React from 'react';
import { useEficienciaSimple } from '../../hooks/useEficienciaSimple';
import { BarChart3, Clock, CheckCircle, Activity } from 'lucide-react';

export const DashboardEficienciaSimple: React.FC = () => {
  const { data, loading, error, refetch } = useEficienciaSimple();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando métricas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="bg-slate-800 border border-red-500/50 rounded-xl p-8 max-w-md text-center">
          <p className="text-red-400 mb-4">Error: {error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">No hay datos disponibles</p>
          <p className="text-slate-500 text-sm mt-2">
            Aún no hay siniestros con seguimiento de etapas.
            <br />
            Los datos aparecerán automáticamente cuando se procesen nuevos registros.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-100">Dashboard de Eficiencia por Etapas</h1>
          <p className="text-slate-400 mt-2">Basado en estado_interno y fechas de ingesta</p>
        </header>

        {/* KPIs Principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Siniestros</p>
                <p className="text-3xl font-bold text-slate-100">{data.total}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Activos</p>
                <p className="text-3xl font-bold text-yellow-400">{data.activos}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Finalizados</p>
                <p className="text-3xl font-bold text-green-400">{data.finalizados}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Lead Time Promedio</p>
                <p className="text-3xl font-bold text-purple-400">{data.leadTimePromedio}d</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Distribución por Estado */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-6">
            Distribución por Estado/Etapa
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-slate-300">Etapa</th>
                  <th className="px-4 py-3 text-left text-slate-300">Estado</th>
                  <th className="px-4 py-3 text-right text-slate-300">Cantidad</th>
                  <th className="px-4 py-3 text-right text-slate-300">Promedio Días</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {data.porEstado.map(item => (
                  <tr key={item.estado} className="hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 text-slate-300 font-medium">
                        {item.etapa || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-100">{item.estado}</td>
                    <td className="px-4 py-3 text-right text-slate-100 font-semibold">
                      {item.cantidad}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">
                      {Math.round(item.promedioDias)} días
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Nota informativa */}
        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-blue-200 text-sm">
            <strong>Nota:</strong> Este dashboard muestra métricas basadas en el estado_interno
            actual de los siniestros y las fechas de ingesta. El seguimiento detallado por etapas se
            construirá progresivamente a medida que se procesen nuevos registros.
          </p>
        </div>
      </div>
    </div>
  );
};
