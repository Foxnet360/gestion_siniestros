import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface IndicadorCalidadDatosProps {
  totalAnalizados: number;
  incluidosEnKPI: number;
  excluidos: {
    total: number;
    porcentaje: number;
    porRazon: {
      sinEtapa1: number;
      sinEtapa16: number;
      datosInsuficientes: number;
    };
  };
  alerta?: string;
}

export const IndicadorCalidadDatos: React.FC<IndicadorCalidadDatosProps> = ({
  totalAnalizados,
  incluidosEnKPI,
  excluidos,
  alerta,
}) => {
  const porcentajeIncluidos =
    totalAnalizados > 0 ? Math.round((incluidosEnKPI / totalAnalizados) * 100) : 0;

  return (
    <div className="mb-6">
      {/* Alerta si existe */}
      {alerta && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-200 font-medium">Alerta de calidad de datos</p>
            <p className="text-yellow-200/80 text-sm">{alerta}</p>
          </div>
        </div>
      )}

      {/* Indicador principal */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Calidad de datos:</span>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400">Analizados:</span>
                <span className="text-slate-900 dark:text-slate-100 font-semibold">
                  {totalAnalizados.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                <span className="text-slate-500 dark:text-slate-400">Incluidos en KPI:</span>
                <span className="text-green-400 font-semibold">
                  {incluidosEnKPI.toLocaleString()} ({porcentajeIncluidos}%)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400">Excluidos:</span>
                <span
                  className={`font-semibold ${
                    excluidos.porcentaje > 30 ? 'text-red-400' : 'text-yellow-400'
                  }`}
                >
                  {excluidos.total.toLocaleString()} ({excluidos.porcentaje.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Tooltip de detalle */}
          <div className="relative group">
            <button className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white text-sm underline transition-colors">
              Ver detalle
            </button>

            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <h4 className="text-slate-900 dark:text-slate-100 font-medium mb-2">Razones de exclusion:</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Sin etapa 1 (Aviso):</span>
                  <span className="text-slate-900 dark:text-slate-100">{excluidos.porRazon.sinEtapa1}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Sin etapa 16 (Pagado):</span>
                  <span className="text-slate-900 dark:text-slate-100">{excluidos.porRazon.sinEtapa16}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Datos insuficientes:</span>
                  <span className="text-slate-900 dark:text-slate-100">{excluidos.porRazon.datosInsuficientes}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Barra de progreso visual */}
        <div className="mt-3 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${porcentajeIncluidos}%` }}
          />
        </div>
      </div>
    </div>
  );
};
