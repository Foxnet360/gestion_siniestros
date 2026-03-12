import React, { useState } from 'react';
import { MetricaEtapaResponse as MetricaEtapa } from '../../../services/EficienciaEtapasService';
import { ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react';

interface TablaMetricasPorEtapaProps {
  metricas: MetricaEtapa[];
  onExportar?: () => void;
}

type SortKey = keyof MetricaEtapa;
type SortOrder = 'asc' | 'desc';

export const TablaMetricasPorEtapa: React.FC<TablaMetricasPorEtapaProps> = ({
  metricas,
  onExportar,
}) => {
  const [sortKey, setSortKey] = useState<SortKey>('etapaNum');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const sortedMetricas = [...metricas].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];

    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }

    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();

    if (sortOrder === 'asc') {
      return aStr.localeCompare(bStr);
    }
    return bStr.localeCompare(aStr);
  });

  const formatDias = (dias: number | undefined): string => {
    if (dias === undefined || dias === null) return '-';
    if (dias < 30) return `${Math.round(dias)}d`;
    return `${Math.round(dias / 30)}m`;
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 text-slate-500" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-blue-400" />
    ) : (
      <ArrowDown className="w-4 h-4 text-blue-400" />
    );
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-100">Métricas Detalladas por Etapa</h3>
        {onExportar && (
          <button
            onClick={onExportar}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-700/50">
            <tr>
              <th
                className="px-4 py-3 text-left text-slate-300 font-medium cursor-pointer hover:bg-slate-700"
                onClick={() => handleSort('etapaNum')}
              >
                <div className="flex items-center gap-2">
                  Etapa
                  <SortIcon columnKey="etapaNum" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-slate-300 font-medium cursor-pointer hover:bg-slate-700"
                onClick={() => handleSort('etapaNombre')}
              >
                <div className="flex items-center gap-2">
                  Nombre
                  <SortIcon columnKey="etapaNombre" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-right text-slate-300 font-medium cursor-pointer hover:bg-slate-700"
                onClick={() => handleSort('cantidadSiniestros')}
              >
                <div className="flex items-center justify-end gap-2">
                  Siniestros
                  <SortIcon columnKey="cantidadSiniestros" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-right text-slate-300 font-medium cursor-pointer hover:bg-slate-700"
                onClick={() => handleSort('tiempoPromedio')}
              >
                <div className="flex items-center justify-end gap-2">
                  Tiempo Prom.
                  <SortIcon columnKey="tiempoPromedio" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-right text-slate-300 font-medium cursor-pointer hover:bg-slate-700"
                onClick={() => handleSort('tiempoP90')}
              >
                <div className="flex items-center justify-end gap-2">
                  P90
                  <SortIcon columnKey="tiempoP90" />
                </div>
              </th>
              <th className="px-4 py-3 text-right text-slate-300 font-medium">SLA</th>
              <th
                className="px-4 py-3 text-right text-slate-300 font-medium cursor-pointer hover:bg-slate-700"
                onClick={() => handleSort('cumpleSLAPorcentaje')}
              >
                <div className="flex items-center justify-end gap-2">
                  % Cumple SLA
                  <SortIcon columnKey="cumpleSLAPorcentaje" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-right text-slate-300 font-medium cursor-pointer hover:bg-slate-700"
                onClick={() => handleSort('tasaConversion')}
              >
                <div className="flex items-center justify-end gap-2">
                  Conversión
                  <SortIcon columnKey="tasaConversion" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {sortedMetricas
              .filter(m => m.cantidadSiniestros > 0)
              .map(etapa => (
                <tr key={etapa.etapaNum} className="hover:bg-slate-700/50">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 text-slate-300 font-medium">
                      {etapa.etapaNum}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-100">{etapa.etapaNombre}</td>
                  <td className="px-4 py-3 text-right text-slate-100">
                    {etapa.cantidadSiniestros.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-100">
                    {formatDias(etapa.tiempoPromedio)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-100">
                    {formatDias(etapa.tiempoP90)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400">
                    {etapa.diasSLA ? formatDias(etapa.diasSLA) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`font-medium ${
                        etapa.cumpleSLAPorcentaje >= 80
                          ? 'text-green-400'
                          : etapa.cumpleSLAPorcentaje >= 50
                            ? 'text-yellow-400'
                            : 'text-red-400'
                      }`}
                    >
                      {etapa.cumpleSLAPorcentaje.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`font-medium ${
                        etapa.tasaConversion >= 90
                          ? 'text-green-400'
                          : etapa.tasaConversion >= 70
                            ? 'text-yellow-400'
                            : 'text-red-400'
                      }`}
                    >
                      {etapa.tasaConversion.toFixed(1)}%
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
