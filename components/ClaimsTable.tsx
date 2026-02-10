import React from 'react';
import { Claim } from '../types';
import { getPhaseColor } from '../constants';
import { ChevronRight, Search } from 'lucide-react';

interface ClaimsTableProps {
  claims: Claim[];
  onSelectClaim: (claim: Claim) => void;
}

const ClaimsTable: React.FC<ClaimsTableProps> = ({ claims, onSelectClaim }) => {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center">
        <h3 className="font-bold text-white">Listado Maestro</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Buscar por placa, póliza..." 
            className="bg-slate-900 border border-slate-700 text-sm rounded-lg pl-9 pr-4 py-2 text-white focus:ring-1 focus:ring-blue-500 outline-none w-64"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-900 text-slate-400 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-3">Siniestro / Póliza</th>
              <th className="px-6 py-3">Asegurado</th>
              <th className="px-6 py-3">Estado Interno</th>
              <th className="px-6 py-3 text-right">Reclamado</th>
              <th className="px-6 py-3 text-right">Neto a Pagar</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {claims.map((claim) => {
               const color = getPhaseColor(claim.estado_interno);
               // Helper for dynamic tailwind classes
               const badgeClass = `bg-${color}-900/30 text-${color}-200 border-${color}-800`;
               
               return (
                <tr 
                  key={claim.id_softseguros} 
                  className="hover:bg-slate-700/50 transition-colors cursor-pointer"
                  onClick={() => onSelectClaim(claim)}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{claim.numero_siniestro}</div>
                    <div className="text-slate-500 text-xs">{claim.poliza}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {claim.asegurado}
                    <div className="text-slate-500 text-xs">{claim.placa_bien}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border border-transparent ${badgeClass}`}>
                      {claim.estado_interno}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-300 font-mono">
                    ${claim.monto_reclamo.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-medium text-emerald-400">
                    ${((claim.valor_indemnizacion || 0) - (claim.valor_deducible || 0)).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ChevronRight className="w-5 h-5 text-slate-500 inline-block" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClaimsTable;