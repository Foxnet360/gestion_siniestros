import React, { useState, useMemo, useEffect } from 'react';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Claim } from '../../../types';
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
  onSelectClaim?: (claim: Claim) => void;
}

const TablaPrescripcion: React.FC<TablaPrescripcionProps> = ({ data, onSelectClaim }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Reset page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const totalPages = Math.ceil(data.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return data.slice(start, end);
  }, [data, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center shadow-sm">
        <p className="text-slate-500 dark:text-slate-400 font-medium">No se encontraron casos con los filtros seleccionados</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
                <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {paginatedData.map((item) => (
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
                  <td className="px-4 py-3 text-center">
                    {onSelectClaim && (
                      <button
                        onClick={() => onSelectClaim(item.claim)}
                        className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/20 p-2 rounded-lg transition-colors"
                        title="Ver Detalle"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-1">
        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>Mostrar</span>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {[25, 50, 100, 500].map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
            <span>registros</span>
          </div>
          <span className="hidden sm:inline">|</span>
          <span>Mostrando {Math.min(data.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(data.length, currentPage * itemsPerPage)} de {data.length}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Simple logic to show current page and surrounding pages
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TablaPrescripcion;
