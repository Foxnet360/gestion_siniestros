import React from 'react';
import { Claim, User } from '../types';
import { ChevronRight, User as UserIcon } from 'lucide-react';
import { formatDate } from '../utils/formatters';

interface ClaimsTableProps {
  claims: Claim[];
  onSelectClaim: (claim: Claim) => void;
  users?: User[];
}

const ClaimsTable: React.FC<ClaimsTableProps> = ({ claims, onSelectClaim, users = [] }) => {
  // Helper function to get technician name
  const getTechnicianName = (claim: Claim): string => {
    if (claim.tecnico_id && users.length > 0) {
      const technician = users.find(u => u.id === claim.tecnico_id);
      if (technician) {
        return technician.name;
      }
    }
    // Fallback to tecnico_asignado string
    return claim.tecnico_asignado || '-';
  };
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto" style={{ maxWidth: '100vw' }}>
        <table className="text-sm text-left" style={{ minWidth: '2500px' }}>
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase text-xs font-semibold">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">N° Siniestro</th>
              <th className="px-4 py-3 whitespace-nowrap">N° Siniestro Compañía</th>
              <th className="px-4 py-3 whitespace-nowrap">Tipo de Siniestro</th>
              <th className="px-4 py-3 whitespace-nowrap">Fecha del Siniestro</th>
              <th className="px-4 py-3 whitespace-nowrap">Fecha de Aviso</th>
              <th className="px-4 py-3 whitespace-nowrap">Fecha Notificación Aseguradora</th>
              <th className="px-4 py-3 whitespace-nowrap">Proveedor Asignado</th>
              <th className="px-4 py-3 whitespace-nowrap">Póliza</th>
              <th className="px-4 py-3 whitespace-nowrap">Nombre Asegurado</th>
              <th className="px-4 py-3 whitespace-nowrap">Aseguradora</th>
              <th className="px-4 py-3 whitespace-nowrap">Subramo</th>
              <th className="px-4 py-3 whitespace-nowrap">Estado</th>
              <th className="px-4 py-3 whitespace-nowrap">Último Seguimiento</th>
              <th className="px-4 py-3 whitespace-nowrap">Estado Última Gestión</th>
              <th className="px-4 py-3 whitespace-nowrap">Técnico Asignado</th>
              <th className="px-4 py-3 whitespace-nowrap">Próximo Seguimiento</th>
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
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="font-medium text-slate-900 dark:text-white">
                    {claim.numero_siniestro}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {claim.numero_siniestro_compania || '-'}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {claim.tipo_siniestro || '-'}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {formatDate(claim.fecha_ocurrencia)}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {formatDate(claim.fecha_aviso)}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {formatDate(claim.fecha_notificacion_aseguradora)}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {claim.proveedor_asignado || '-'}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {claim.poliza}
                </td>
                <td
                  className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap max-w-[150px] truncate"
                  title={claim.asegurado}
                >
                  {claim.asegurado}
                </td>
                <td
                  className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap max-w-[120px] truncate"
                  title={claim.aseguradora}
                >
                  {claim.aseguradora}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {claim.ramo}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                    {claim.estado_interno}
                  </span>
                </td>
                <td
                  className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-[180px] truncate"
                  title={claim.ultimo_seguimiento_raw || '-'}
                >
                  {claim.ultimo_seguimiento_raw || '-'}
                </td>
                <td
                  className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-[150px] truncate"
                  title={claim.estado_gestion_softseguros || '-'}
                >
                  {claim.estado_gestion_softseguros || '-'}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <UserIcon className="w-3 h-3 text-slate-400" />
                    <span className="truncate max-w-[120px]" title={getTechnicianName(claim)}>
                      {getTechnicianName(claim)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {formatDate(claim.proximo_seguimiento)}
                </td>
                <td className="px-4 py-3 text-right">
                  <ChevronRight className="w-5 h-5 text-slate-500 inline-block" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden">
        {claims.map(claim => (
          <div
            key={claim.id_softseguros}
            className="p-4 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
            onClick={() => onSelectClaim(claim)}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-base">
                  {claim.numero_siniestro}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {claim.numero_siniestro_compania}
                </div>
              </div>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                {claim.estado_interno}
              </span>
            </div>

            <div className="mb-2">
              <span className="text-slate-500 dark:text-slate-400 text-sm">Asegurado:</span>{' '}
              <span className="text-slate-700 dark:text-slate-200 text-sm font-medium">
                {claim.asegurado}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mb-2">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Tipo:</span>{' '}
                <span className="text-slate-700 dark:text-slate-200">
                  {claim.tipo_siniestro || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Subramo:</span>{' '}
                <span className="text-slate-700 dark:text-slate-200">{claim.ramo}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Aseguradora:</span>{' '}
                <span className="text-slate-700 dark:text-slate-200 truncate">
                  {claim.aseguradora}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Póliza:</span>{' '}
                <span className="text-slate-700 dark:text-slate-200">{claim.poliza}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm mb-2">
              <div className="flex gap-4">
                <span className="text-slate-500 dark:text-slate-400">
                  Siniestro: {formatDate(claim.fecha_ocurrencia)}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>

            {claim.estado_gestion_softseguros && (
              <div className="mb-1 text-xs">
                <span className="text-slate-500 dark:text-slate-400">Estado última gestión:</span>{' '}
                <span className="text-slate-700 dark:text-slate-200">
                  {claim.estado_gestion_softseguros}
                </span>
              </div>
            )}

            <div className="mb-1 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Técnico:</span>{' '}
              <span className="text-slate-700 dark:text-slate-200">{getTechnicianName(claim)}</span>
            </div>

            {claim.proximo_seguimiento && (
              <div className="mb-1 text-xs">
                <span className="text-slate-500 dark:text-slate-400">Próximo seguimiento:</span>{' '}
                <span className="text-slate-700 dark:text-slate-200">
                  {formatDate(claim.proximo_seguimiento)}
                </span>
              </div>
            )}

            {claim.ultimo_seguimiento_raw && (
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                Último seguimiento: {claim.ultimo_seguimiento_raw}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClaimsTable;
