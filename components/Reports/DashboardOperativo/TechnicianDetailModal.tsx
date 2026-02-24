import React from 'react';
import type { Claim } from '../../../types';
import { X, Eye } from 'lucide-react';

interface TechnicianDetailModalProps {
    technician: string;
    claims: Claim[];
    onClose: () => void;
    onSelectClaim?: (claim: Claim) => void;
}

const TechnicianDetailModal: React.FC<TechnicianDetailModalProps> = ({ technician, claims, onClose, onSelectClaim }) => {
    // Sort claims: Active first, then by date (newest first)
    const sortedClaims = [...claims].sort((a, b) => {
        if (a.finalizado === b.finalizado) {
            const dateA = a.fecha_aviso ? new Date(a.fecha_aviso).getTime() : 0;
            const dateB = b.fecha_aviso ? new Date(b.fecha_aviso).getTime() : 0;
            return dateB - dateA;
        }
        return a.finalizado ? 1 : -1;
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            Detalle de Gestión
                            <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full text-base">
                                {technician}
                            </span>
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Casos</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{claims.length}</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-xl border border-blue-100 dark:border-blue-500/20">
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Activos</p>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{claims.filter(c => !c.finalizado).length}</p>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Cerrados</p>
                            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{claims.filter(c => c.finalizado).length}</p>
                        </div>
                        <div className="bg-rose-50 dark:bg-rose-500/10 p-4 rounded-xl border border-rose-100 dark:border-rose-500/20">
                            <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">Objeciones</p>
                            <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">{claims.filter(c => c.estado_interno === 'OBJECIÓN').length}</p>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Siniestro</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Asegurado</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estado</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha Aviso</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                                {sortedClaims.map(claim => (
                                    <tr key={claim.id_softseguros} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                        <td className="px-4 py-3 text-sm font-mono font-medium text-slate-900 dark:text-white">{claim.numero_siniestro}</td>
                                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{claim.asegurado}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${claim.estado_interno === 'CERRADO' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' :
                                                    claim.estado_interno === 'OBJECIÓN' ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300' :
                                                        'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
                                                }`}>
                                                {claim.estado_interno}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                                            {claim.fecha_aviso ? new Date(claim.fecha_aviso).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {onSelectClaim && (
                                                <button
                                                    onClick={() => onSelectClaim(claim)}
                                                    className="text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all transform hover:scale-105"
                                                    title="Ver Detalle del Caso"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TechnicianDetailModal;
