import React from 'react';
import { Claim } from '../types';
import { ChevronRight } from 'lucide-react';
import { formatDate } from '../utils/formatters';

interface ClaimsTableProps {
  claims: Claim[];
  onSelectClaim: (claim: Claim) => void;
}

const ClaimsTable: React.FC<ClaimsTableProps> = ({ claims, onSelectClaim }) => {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-slate-900 dark:text-white">Listado Maestro</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase text-xs font-semibold">
            <tr>
              <th className="px-4 py-3">N° Siniestro</th>
              <th className="px-4 py-3">N° Siniestro Compañía</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Fecha Siniestro</th>
              <th className="px-4 py-3">Fecha Aviso</th>
              <th className="px-4 py-3">Fecha Radicación</th>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3">Póliza</th>
              <th className="px-4 py-3">Aseguradora</th>
              <th className="px-4 py-3">Ramo</th>
              <th className="px-4 py-3">Estado Etapa</th>
              <th className="px-4 py-3">Último Seguimiento</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {claims.map(claim => (
              <tr
                key={claim.id_softseguros}
                className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                onClick={() => onSelectClaim(claim)}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900 dark:text-white">
                    {claim.numero_siniestro}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {claim.numero_siniestro_compania || '-'}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {claim.tipo_siniestro || '-'}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {formatDate(claim.fecha_ocurrencia)}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {formatDate(claim.fecha_aviso)}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {formatDate(claim.fecha_notificacion_aseguradora)}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {claim.proveedor_asignado || '-'}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{claim.poliza}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {claim.aseguradora}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{claim.ramo}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                    {claim.estado_interno}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                  {claim.ultimo_seguimiento_raw || '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <ChevronRight className="w-5 h-5 text-slate-500 inline-block" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClaimsTable;
