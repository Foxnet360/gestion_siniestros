import React from 'react';
import { TrendingUp, Clock, AlertTriangle, Users } from 'lucide-react';
import type { ProductividadTecnico } from '../../../types/reports';
import { formatCurrency } from '../../../utils/formatters';

interface ProductividadTecnicosProps {
  data: ProductividadTecnico[];
}

const ProductividadTecnicos: React.FC<ProductividadTecnicosProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center shadow-sm">
        <p className="text-slate-500 dark:text-slate-400 font-medium">No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Productividad por Técnico</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rank</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Técnico</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Casos Activos</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Casos Cerrados</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tiempo Prom.</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">% Recuperación</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estancados</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {data.map((item, index) => (
              <tr key={item.tecnico} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shadow-sm ${index === 0 ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' :
                      index === 1 ? 'bg-slate-200 dark:bg-slate-400/20 text-slate-600 dark:text-slate-300' :
                        index === 2 ? 'bg-amber-100 dark:bg-amber-600/20 text-amber-700 dark:text-amber-500' :
                          'bg-slate-100 dark:bg-slate-700 text-slate-500'
                    }`}>
                    {index + 1}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {item.tecnico.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-slate-700 dark:text-slate-200 font-medium text-sm">{item.tecnico}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-slate-900 dark:text-slate-100 font-bold">{item.casosActivos}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{item.casosCerrados}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-medium ${item.tiempoPromedioCierre > 45 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'
                    }`}>
                    {Math.round(item.tiempoPromedioCierre)} días
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-bold ${item.porcentajeRecuperacion >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                    {item.porcentajeRecuperacion.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {item.casosEstancados > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      {item.casosEstancados}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductividadTecnicos;
