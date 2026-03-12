import React, { useState } from 'react';
import { MetricaEtapaResponse as MetricaEtapa } from '../../../services/EficienciaEtapasService';
import { BarChart3, Clock, Target, ToggleLeft, ToggleRight } from 'lucide-react';

interface TiemposPorEtapaProps {
  metricas: MetricaEtapa[];
}

export const TiemposPorEtapa: React.FC<TiemposPorEtapaProps> = ({ metricas }) => {
  const [mostrarP90, setMostrarP90] = useState(false);

  const getColorBySLA = (tiempo: number, sla?: number): string => {
    if (!sla) return 'bg-slate-500';
    if (tiempo <= sla) return 'bg-green-500';
    if (tiempo <= sla * 1.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatDias = (dias: number): string => {
    if (dias < 30) return `${Math.round(dias)}d`;
    return `${Math.round(dias / 30)}m`;
  };

  // Solo mostrar etapas con datos
  const etapasConDatos = metricas.filter(m => m.cantidadSiniestros > 0);
  const maxTiempo = Math.max(
    ...etapasConDatos.map(m => (mostrarP90 ? m.tiempoP90 : m.tiempoPromedio)),
    1
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Tiempos por Etapa vs SLA</h2>
        </div>

        <button
          onClick={() => setMostrarP90(!mostrarP90)}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-lg transition-colors"
        >
          {mostrarP90 ? (
            <>
              <ToggleRight className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-slate-300">Mostrando P90</span>
            </>
          ) : (
            <>
              <ToggleLeft className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600 dark:text-slate-300">Mostrando Promedio</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        {etapasConDatos.map(etapa => {
          const tiempo = mostrarP90 ? etapa.tiempoP90 : etapa.tiempoPromedio;
          const porcentaje = maxTiempo > 0 ? (tiempo / maxTiempo) * 100 : 0;
          const cumpleSLA = etapa.diasSLA ? tiempo <= etapa.diasSLA : null;

          return (
            <div key={etapa.etapaNum} className="group">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 text-sm font-medium flex-shrink-0">
                  {etapa.etapaNum}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-600 dark:text-slate-400 text-sm font-medium truncate">
                      {etapa.etapaNombre}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-900 dark:text-slate-100 font-semibold">{formatDias(tiempo)}</span>
                      {etapa.diasSLA && (
                        <span
                          className={`text-xs ${cumpleSLA ? 'text-green-400' : 'text-red-400'}`}
                        >
                          SLA: {formatDias(etapa.diasSLA)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative h-6 bg-slate-100 dark:bg-slate-700/50 rounded-lg overflow-hidden border border-slate-200 dark:border-transparent">
                    <div
                      className={`h-full ${getColorBySLA(tiempo, etapa.diasSLA)} transition-all duration-500`}
                      style={{ width: `${porcentaje}%` }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white/50"
                      style={{
                        left: etapa.diasSLA ? `${(etapa.diasSLA / maxTiempo) * 100}%` : '100%',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Tooltip detalle */}
              <div className="mt-1 ml-12 flex items-center gap-4 text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>{etapa.cantidadSiniestros} siniestros</span>
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {etapa.cumpleSLAPorcentaje.toFixed(0)}% cumple SLA
                </span>
                {etapa.frecuenciaSeguimientoPromedio && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Seguimiento cada {etapa.frecuenciaSeguimientoPromedio.toFixed(1)} días
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-slate-400">Dentro SLA</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span className="text-slate-400">1-1.5x SLA</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-slate-400">{'>'}1.5x SLA</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-0.5 h-3 bg-white/50" />
          <span className="text-slate-400">Límite SLA</span>
        </div>
      </div>
    </div>
  );
};
