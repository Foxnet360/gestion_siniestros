import React from 'react';
import { SegmentoData } from '../../../services/EficienciaEtapasService';
import { TrendingUp, Calendar } from 'lucide-react';

interface TendenciaTemporalProps {
  segmentos?: SegmentoData[];
}

interface DatosTendencia {
  mes: string;
  normal: number;
  prescripcionOrd: number;
  prescripcionExt: number;
}

export const TendenciaTemporal: React.FC<TendenciaTemporalProps> = ({ segmentos }) => {
  // Generar datos de ejemplo para los últimos 6 meses
  const generarDatosTendencia = (): DatosTendencia[] => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    return meses.map((mes, index) => ({
      mes,
      normal: 35 + Math.random() * 10 - index * 2,
      prescripcionOrd: 680 + Math.random() * 50 - index * 10,
      prescripcionExt: 1200 + Math.random() * 100 - index * 20,
    }));
  };

  const datos = generarDatosTendencia();
  const maxValor = Math.max(
    ...datos.map(d => Math.max(d.normal, d.prescripcionOrd / 20, d.prescripcionExt / 40))
  );

  const formatDias = (dias: number): string => {
    if (dias < 30) return `${Math.round(dias)}d`;
    if (dias < 365) return `${Math.round(dias / 30)}m`;
    return `${Math.round((dias / 365) * 10) / 10}a`;
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-slate-100">
            Tendencia Temporal (Últimos 6 meses)
          </h2>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Calendar className="w-4 h-4" />
          <span>Lead Time Promedio</span>
        </div>
      </div>

      {/* Gráfico de líneas simple */}
      <div className="relative h-64 mb-6">
        {/* Grid */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="border-t border-slate-700/50 w-full" />
          ))}
        </div>

        {/* Líneas */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          {/* Línea Normal */}
          <polyline
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
            points={datos
              .map((d, i) => {
                const x = (i / (datos.length - 1)) * 100;
                const y = 100 - (d.normal / maxValor) * 100;
                return `${x},${y}`;
              })
              .join(' ')}
          />

          {/* Línea Prescripción Ord */}
          <polyline
            fill="none"
            stroke="#eab308"
            strokeWidth="2"
            points={datos
              .map((d, i) => {
                const x = (i / (datos.length - 1)) * 100;
                const y = 100 - (d.prescripcionOrd / 20 / maxValor) * 100;
                return `${x},${y}`;
              })
              .join(' ')}
          />

          {/* Línea Prescripción Ext */}
          <polyline
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            points={datos
              .map((d, i) => {
                const x = (i / (datos.length - 1)) * 100;
                const y = 100 - (d.prescripcionExt / 40 / maxValor) * 100;
                return `${x},${y}`;
              })
              .join(' ')}
          />
        </svg>

        {/* Puntos */}
        <div className="absolute inset-0">
          {datos.map((d, i) => {
            const x = (i / (datos.length - 1)) * 100;
            return (
              <div
                key={i}
                className="absolute top-0 bottom-0 flex items-center"
                style={{ left: `${x}%`, transform: 'translateX(-50%)' }}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-slate-800" />
                  <span className="text-xs text-slate-400 mt-8">{d.mes}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leyenda y valores */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-slate-300 text-sm">Normal</span>
          </div>
          <p className="text-2xl font-bold text-green-400">
            {formatDias(datos[datos.length - 1].normal)}
          </p>
          <p className="text-xs text-slate-500">Último mes</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-slate-300 text-sm">Presc. Ord</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400">
            {formatDias(datos[datos.length - 1].prescripcionOrd)}
          </p>
          <p className="text-xs text-slate-500">Último mes</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-slate-300 text-sm">Presc. Ext</span>
          </div>
          <p className="text-2xl font-bold text-red-400">
            {formatDias(datos[datos.length - 1].prescripcionExt)}
          </p>
          <p className="text-xs text-slate-500">Último mes</p>
        </div>
      </div>
    </div>
  );
};
