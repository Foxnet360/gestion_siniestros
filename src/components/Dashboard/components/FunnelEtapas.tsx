import React from 'react';
import { FunnelEtapaData as FunnelEtapa } from '../../../services/EficienciaEtapasService';
import { ChevronRight, Users } from 'lucide-react';

interface FunnelEtapasProps {
  etapas: FunnelEtapa[];
  conversionGeneral: number;
}

export const FunnelEtapas: React.FC<FunnelEtapasProps> = ({ etapas, conversionGeneral }) => {
  const getColorByConversion = (tasa: number): string => {
    if (tasa >= 90) return 'bg-green-500';
    if (tasa >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColorByConversion = (tasa: number): string => {
    if (tasa >= 90) return 'text-green-600 dark:text-green-400';
    if (tasa >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Solo mostrar etapas con datos
  const etapasConDatos = etapas.filter(e => e.entrada > 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Funnel de Conversión entre Etapas</h2>
        <div className="text-right">
          <p className="text-slate-500 dark:text-slate-400 text-sm">Conversión General</p>
          <p className={`text-2xl font-bold ${getTextColorByConversion(conversionGeneral)}`}>
            {conversionGeneral.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {etapasConDatos.map((etapa, index) => {
          const maxEntrada = Math.max(...etapasConDatos.map(e => e.entrada));
          const anchoBarra = maxEntrada > 0 ? (etapa.entrada / maxEntrada) * 100 : 0;

          return (
            <div key={etapa.etapaNum} className="relative">
              <div className="flex items-center gap-4">
                {/* Número de etapa */}
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-sm font-medium flex-shrink-0">
                  {etapa.etapaNum}
                </div>

                {/* Barra de funnel */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-700 dark:text-slate-300 text-sm font-medium truncate max-w-[200px]">
                      {etapa.etapaNombre}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {etapa.entrada.toLocaleString()}
                      </span>
                      {etapa.tasaConversion > 0 && (
                        <span
                          className={`text-sm font-medium ${getTextColorByConversion(etapa.tasaConversion)}`}
                        >
                          {etapa.tasaConversion.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="h-8 bg-slate-100 dark:bg-slate-700/50 rounded-lg overflow-hidden relative border border-slate-200 dark:border-transparent">
                    <div
                      className={`h-full ${getColorByConversion(etapa.tasaConversion)} transition-all duration-500 opacity-80 dark:opacity-100`}
                      style={{ width: `${anchoBarra}%` }}
                    />
                  </div>
                </div>

                {/* Flecha de conversión (excepto última) */}
                {index < etapasConDatos.length - 1 && etapa.tasaConversion > 0 && (
                  <div className="flex-shrink-0">
                    <ChevronRight
                      className={`w-5 h-5 ${getTextColorByConversion(etapa.tasaConversion)}`}
                    />
                  </div>
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
          <span className="text-slate-500 dark:text-slate-400">Bueno (&gt;90%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span className="text-slate-500 dark:text-slate-400">Regular (70-90%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-slate-500 dark:text-slate-400">Crítico (&lt;70%)</span>
        </div>
      </div>
    </div>
  );
};
