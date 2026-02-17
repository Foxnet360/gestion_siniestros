import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import type { CasoEstancado } from '../../../types/reports';
import { formatDate } from '../../../utils/formatters';

interface CasosEstancadosProps {
  data: CasoEstancado[];
  diasUmbral: number;
  onDiasChange: (dias: number) => void;
}

const CasosEstancados: React.FC<CasosEstancadosProps> = ({
  data,
  diasUmbral,
  onDiasChange
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Casos Estancados</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Casos sin movimiento por más de {diasUmbral} días</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Días:</label>
          <select
            value={diasUmbral}
            onChange={(e) => onDiasChange(Number(e.target.value))}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value={15}>15 días</option>
            <option value={30}>30 días</option>
            <option value={45}>45 días</option>
            <option value={60}>60 días</option>
          </select>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 mb-3">
            <Clock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">No hay casos estancados</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Siniestro</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Aseguradora</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Último Cambio</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Días</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {data.map((item) => (
                <tr key={item.claim.id_softseguros} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-slate-900 dark:text-slate-100 font-mono text-sm font-medium">{item.claim.numero_siniestro}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-slate-700 dark:text-slate-200 text-sm font-medium">{item.claim.asegurado}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-slate-600 dark:text-slate-400 text-sm">{item.claim.aseguradora}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold
                      bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      {item.claim.estado_interno}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-slate-600 dark:text-slate-400 text-sm">
                      {item.claim.lastStateChangeDate
                        ? formatDate(item.claim.lastStateChangeDate)
                        : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold shadow-sm ${item.diasSinMovimiento > 45
                        ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'
                        : item.diasSinMovimiento > 30
                          ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                          : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                      }`}>
                      <AlertTriangle className="w-4 h-4" />
                      {item.diasSinMovimiento}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CasosEstancados;
