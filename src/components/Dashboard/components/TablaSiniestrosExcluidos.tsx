import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react';

interface SiniestroExcluido {
  claimId: string;
  razon: string;
  datosDisponibles?: string;
}

interface TablaSiniestrosExcluidosProps {
  excluidos: {
    total: number;
    porRazon: {
      sinEtapa1: number;
      sinEtapa16: number;
      datosInsuficientes: number;
    };
  };
  onExportar?: () => void;
}

type SortKey = 'claimId' | 'razon';
type SortOrder = 'asc' | 'desc';

export const TablaSiniestrosExcluidos: React.FC<TablaSiniestrosExcluidosProps> = ({
  excluidos,
  onExportar,
}) => {
  const [sortKey, setSortKey] = useState<SortKey>('razon');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Datos de ejemplo basados en las razones
  const datosEjemplo: SiniestroExcluido[] = [
    { claimId: 'SS-001', razon: 'Sin etapa 1 (Aviso)', datosDisponibles: 'Etapas 2-8' },
    { claimId: 'SS-002', razon: 'Sin etapa 16 (Pagado)', datosDisponibles: 'Etapas 1-14' },
    { claimId: 'SS-003', razon: 'Sin etapa 1 (Aviso)', datosDisponibles: 'Etapas 3-10' },
    { claimId: 'SS-004', razon: 'Datos insuficientes', datosDisponibles: 'Solo etapa 1' },
    { claimId: 'SS-005', razon: 'Sin etapa 16 (Pagado)', datosDisponibles: 'Etapas 1-12' },
  ];

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const getRazonLabel = (razon: string): string => {
    if (razon.includes('etapa 1')) return 'Sin etapa 1 (Aviso)';
    if (razon.includes('etapa 16')) return 'Sin etapa 16 (Pagado)';
    return 'Datos insuficientes';
  };

  const getRazonColor = (razon: string): string => {
    if (razon.includes('etapa 1')) return 'text-yellow-400';
    if (razon.includes('etapa 16')) return 'text-orange-400';
    return 'text-red-400';
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
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-100">Siniestros Excluidos del KPI</h3>
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

        {/* Resumen de exclusiones */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-700/50 rounded-lg p-3">
            <p className="text-slate-400 text-sm">Sin etapa 1</p>
            <p className="text-xl font-bold text-yellow-400">{excluidos.porRazon.sinEtapa1}</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3">
            <p className="text-slate-400 text-sm">Sin etapa 16</p>
            <p className="text-xl font-bold text-orange-400">{excluidos.porRazon.sinEtapa16}</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3">
            <p className="text-slate-400 text-sm">Datos insuficientes</p>
            <p className="text-xl font-bold text-red-400">
              {excluidos.porRazon.datosInsuficientes}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-700/50">
            <tr>
              <th
                className="px-4 py-3 text-left text-slate-300 font-medium cursor-pointer hover:bg-slate-700"
                onClick={() => handleSort('claimId')}
              >
                <div className="flex items-center gap-2">
                  ID Siniestro
                  <SortIcon columnKey="claimId" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-slate-300 font-medium cursor-pointer hover:bg-slate-700"
                onClick={() => handleSort('razon')}
              >
                <div className="flex items-center gap-2">
                  Razon de exclusion
                  <SortIcon columnKey="razon" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-slate-300 font-medium">Datos disponibles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {datosEjemplo.map(item => (
              <tr key={item.claimId} className="hover:bg-slate-700/50">
                <td className="px-4 py-3 text-slate-100 font-mono">{item.claimId}</td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${getRazonColor(item.razon)}`}>
                    {getRazonLabel(item.razon)}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">{item.datosDisponibles || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-700 text-center">
        <p className="text-slate-400 text-sm">
          Mostrando ejemplo de {datosEjemplo.length} siniestros excluidos
        </p>
      </div>
    </div>
  );
};
