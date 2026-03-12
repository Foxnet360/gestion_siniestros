import React from 'react';
import { CuelloDeBotellaResponse as CuelloDeBotella } from '../../../services/EficienciaEtapasService';
import { AlertTriangle, Clock, AlertCircle, Users } from 'lucide-react';

interface CuellosDeBotellaProps {
  cuellos: CuelloDeBotella[];
}

export const CuellosDeBotella: React.FC<CuellosDeBotellaProps> = ({ cuellos }) => {
  if (cuellos.length === 0) return null;

  const getSeveridadIcon = (severidad: string) => {
    switch (severidad) {
      case 'alta':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'media':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Clock className="w-5 h-5 text-blue-400" />;
    }
  };

  const getSeveridadColor = (severidad: string): string => {
    switch (severidad) {
      case 'alta':
        return 'bg-red-500/10 border-red-500/30';
      case 'media':
        return 'bg-yellow-500/10 border-yellow-500/30';
      default:
        return 'bg-blue-500/10 border-blue-500/30';
    }
  };

  const formatDias = (dias: number): string => {
    if (dias < 30) return `${dias} días`;
    if (dias < 365) return `${Math.round(dias / 30)} meses`;
    return `${Math.round((dias / 365) * 10) / 10} años`;
  };

  return (
    <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Cuellos de Botella Identificados</h2>
        <span className="ml-auto text-slate-500 dark:text-slate-400 text-sm">
          {cuellos.length} {cuellos.length === 1 ? 'encontrado' : 'encontrados'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cuellos.map(cuello => (
          <div
            key={cuello.etapaNum}
            className={`p-4 rounded-xl border ${getSeveridadColor(cuello.severidad)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/50 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-transparent">
                  {cuello.etapaNum}
                </div>
                <div>
                  <h3 className="text-slate-900 dark:text-slate-100 font-medium">{cuello.etapaNombre}</h3>
                  <span
                    className={`text-xs font-medium ${
                      cuello.severidad === 'alta'
                        ? 'text-red-400'
                        : cuello.severidad === 'media'
                          ? 'text-yellow-400'
                          : 'text-blue-400'
                    }`}
                  >
                    Severidad: {cuello.severidad.toUpperCase()}
                  </span>
                </div>
              </div>
              {getSeveridadIcon(cuello.severidad)}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Tiempo promedio:</span>
                <span className="text-slate-900 dark:text-slate-100 font-medium">
                  {formatDias(cuello.tiempoPromedio)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">SLA definido:</span>
                <span className="text-slate-900 dark:text-slate-100">{formatDias(cuello.diasSLA)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Desviación:</span>
                <span
                  className={`font-medium ${
                    cuello.desviacionSLA > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {cuello.desviacionSLA > 0 ? '+' : ''}
                  {formatDias(cuello.desviacionSLA)}
                </span>
              </div>

              <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700/50 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Siniestros afectados:
                </span>
                <span className="text-slate-900 dark:text-slate-100 font-semibold">
                  {cuello.cantidadSiniestrosAfectados.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
