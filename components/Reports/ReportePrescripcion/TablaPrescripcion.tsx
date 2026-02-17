import React from 'react';
import type { PrescripcionRiskData, RiesgoPrescripcion } from '../../../types/reports';
import { RIESGO_COLORS } from '../../../constants/reports';
import { formatDate } from '../../../utils/formatters';

interface RiesgoBadgeProps {
  nivel: RiesgoPrescripcion;
  diasRestantes: number;
}

const RiesgoBadge: React.FC<RiesgoBadgeProps> = ({ nivel, diasRestantes }) => {
  const config = RIESGO_COLORS[nivel];
  const isExpired = diasRestantes < 0;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bg} bg-opacity-20`}>
      <span className="text-lg">{config.emoji}</span>
      <span className={`text-sm font-medium ${config.text}`}>
        {isExpired ? 'VENCIDO' : `${diasRestantes} días`}
      </span>
    </div>
  );
};

interface TablaPrescripcionProps {
  data: PrescripcionRiskData[];
}

const TablaPrescripcion: React.FC<TablaPrescripcionProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center shadow-sm">
        <p className="text-slate-500 dark:text-slate-400 font-medium">No se encontraron casos con los filtros seleccionados</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Riesgo</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Siniestro</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cliente</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Aseguradora</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ramo</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Responsable</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha Aviso</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Prescripción</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sin Movimiento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {data.map((item) => (
              <tr key={item.claim.id_softseguros} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <td className="px-4 py-3">
                  <RiesgoBadge nivel={item.nivelRiesgo} diasRestantes={item.diasRestantes} />
                </td>
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
                  <span className="text-slate-600 dark:text-slate-400 text-sm">{item.claim.ramo}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-slate-600 dark:text-slate-400 text-sm">{item.claim.tecnico_asignado}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-slate-600 dark:text-slate-400 text-sm">
                    {item.claim.fecha_aviso ? formatDate(item.claim.fecha_aviso) : '-'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-slate-600 dark:text-slate-400 text-sm">
                    {item.claim.prescripcion_ordinaria ? formatDate(item.claim.prescripcion_ordinaria) : '-'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-bold ${item.diasSinMovimiento > 30 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                    {item.diasSinMovimiento} días
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TablaPrescripcion;
