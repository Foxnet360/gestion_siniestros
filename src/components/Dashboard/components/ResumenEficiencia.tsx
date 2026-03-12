import React from 'react';
import { MetricasEficienciaResponse } from '../../../services/EficienciaEtapasService';

type ResumenEficienciaType = MetricasEficienciaResponse['resumen'];
import { Clock, Target, TrendingUp, Calendar } from 'lucide-react';

interface ResumenEficienciaProps {
  resumen: ResumenEficienciaType;
}

export const ResumenEficiencia: React.FC<ResumenEficienciaProps> = ({ resumen }) => {
  const formatDias = (dias: number): string => {
    if (dias < 30) return `${dias} días`;
    if (dias < 365) return `${Math.round(dias / 30)} meses`;
    return `${Math.round((dias / 365) * 10) / 10} años`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Siniestros */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Total Siniestros</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {resumen.totalSiniestros.toLocaleString()}
            </p>
          </div>
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Target className="w-5 h-5 text-blue-400" />
          </div>
        </div>
        <p className="text-slate-500 text-xs mt-2">
          {resumen.porcentajeCompletos.toFixed(1)}% con datos completos
        </p>
      </div>

      {/* Lead Time Promedio */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Lead Time Promedio</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {formatDias(resumen.leadTimeAvg)}
            </p>
          </div>
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Clock className="w-5 h-5 text-green-400" />
          </div>
        </div>
        <p className="text-slate-500 text-xs mt-2">P90: {formatDias(resumen.leadTimeP90)}</p>
      </div>

      {/* Lead Time Mediana */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Lead Time Mediana (P50)</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {formatDias(resumen.leadTimeP50)}
            </p>
          </div>
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
        </div>
        <p className="text-slate-500 text-xs mt-2">
          Rango: {formatDias(resumen.leadTimeMin)} - {formatDias(resumen.leadTimeMax)}
        </p>
      </div>

      {/* Tiempo Total Rango */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Rango de Tiempos</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {formatDias(resumen.leadTimeMax)}
            </p>
          </div>
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <Calendar className="w-5 h-5 text-orange-400" />
          </div>
        </div>
        <p className="text-slate-500 text-xs mt-2">Máximo registrado</p>
      </div>
    </div>
  );
};
