import React, { useMemo, useState } from 'react';
import { Claim } from '../types';
import { ChevronRight, Search, AlertTriangle, ArrowLeft } from 'lucide-react';
import { getPhaseColor } from '../constants';

interface PrescriptionRiskPageProps {
    claims: Claim[];
    onSelectClaim: (claim: Claim) => void;
    onBack: () => void;
}

const PrescriptionRiskPage: React.FC<PrescriptionRiskPageProps> = ({ claims, onSelectClaim, onBack }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // States for filters
    const [filters, setFilters] = useState({
        asegurado: '', // Cliente
        estado_interno: '',
        ramo: '',
        aseguradora: '',
        vendedor: '',
        tecnico_asignado: ''
    });

    // Calculate prescription date: Occurrence + 2 years
    const getPrescriptionDate = (dateStr: string) => {
        const d = new Date(dateStr);
        d.setFullYear(d.getFullYear() + 2);
        return d;
    };

    // Filter and Sort Claims
    const riskClaims = useMemo(() => {
        return claims.filter(c => {
            // 1. Basic Risk Criteria
            if (!c.fecha_ocurrencia || c.estado_interno === 'PAGADO' || c.estado_interno === 'FINALIZADO') return false;
            const ocurrencia = new Date(c.fecha_ocurrencia);
            if (isNaN(ocurrencia.getTime())) return false;

            const now = new Date();
            const prescriptionDate = getPrescriptionDate(c.fecha_ocurrencia);

            // Calculate days until prescription
            const daysToPrescription = Math.ceil((prescriptionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            // Filter by risk window (e.g., < 90 days) AND positive days (not yet prescribed)
            // Note: Adjust 90 days based on the alert logic in Dashboard.tsx
            const isRisk = daysToPrescription < 90 && daysToPrescription > 0;
            if (!isRisk) return false;

            // 2. Search Term
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                c.numero_siniestro.toLowerCase().includes(searchLower) ||
                c.poliza.toLowerCase().includes(searchLower) ||
                c.placa_bien?.toLowerCase().includes(searchLower) ||
                c.asegurado.toLowerCase().includes(searchLower);

            if (!matchesSearch) return false;

            // 3. Dynamic Filters
            if (filters.asegurado && c.asegurado !== filters.asegurado) return false;
            if (filters.estado_interno && c.estado_interno !== filters.estado_interno) return false;
            if (filters.ramo && c.ramo !== filters.ramo) return false;
            if (filters.aseguradora && c.aseguradora !== filters.aseguradora) return false;
            if (filters.vendedor && c.vendedor !== filters.vendedor) return false;
            if (filters.tecnico_asignado && c.tecnico_asignado !== filters.tecnico_asignado) return false;

            return true;
        }).sort((a, b) => {
            // Sort by closest prescription date
            const dateA = getPrescriptionDate(a.fecha_ocurrencia).getTime();
            const dateB = getPrescriptionDate(b.fecha_ocurrencia).getTime();
            return dateA - dateB;
        });
    }, [claims, searchTerm, filters]);

    // Extract unique values for filters
    const getUniqueValues = (key: keyof Claim) => {
        return Array.from(new Set(claims.map(c => String(c[key] || '')).filter(Boolean))).sort();
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center space-x-4 mb-6">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-rose-400 flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6" />
                        Casos Próximos a Prescribir
                    </h2>
                    <p className="text-slate-400 text-sm">Gestiona los casos que vencen pronto (Próximos 90 días)</p>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-4">
                {/* Search and Stats */}
                <div className="flex justify-between items-center">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar siniestro, póliza, placa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-sm rounded-lg pl-9 pr-4 py-2 text-white focus:ring-1 focus:ring-rose-500 outline-none w-80"
                        />
                    </div>
                    <div className="text-sm text-slate-400">
                        Mostrando <span className="font-bold text-white">{riskClaims.length}</span> casos críticos
                    </div>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-700/50">
                    <select
                        className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-3 py-2 text-slate-300 outline-none focus:border-rose-500"
                        value={filters.asegurado}
                        onChange={(e) => handleFilterChange('asegurado', e.target.value)}
                    >
                        <option value="">Todos los Clientes</option>
                        {getUniqueValues('asegurado').map(val => <option key={val} value={val}>{val}</option>)}
                    </select>

                    <select
                        className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-3 py-2 text-slate-300 outline-none focus:border-rose-500"
                        value={filters.aseguradora}
                        onChange={(e) => handleFilterChange('aseguradora', e.target.value)}
                    >
                        <option value="">Todas las Aseguradoras</option>
                        {getUniqueValues('aseguradora').map(val => <option key={val} value={val}>{val}</option>)}
                    </select>

                    <select
                        className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-3 py-2 text-slate-300 outline-none focus:border-rose-500"
                        value={filters.ramo}
                        onChange={(e) => handleFilterChange('ramo', e.target.value)}
                    >
                        <option value="">Todos los Ramos</option>
                        {getUniqueValues('ramo').map(val => <option key={val} value={val}>{val}</option>)}
                    </select>

                    <select
                        className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-3 py-2 text-slate-300 outline-none focus:border-rose-500"
                        value={filters.estado_interno}
                        onChange={(e) => handleFilterChange('estado_interno', e.target.value)}
                    >
                        <option value="">Todos los Estados</option>
                        {getUniqueValues('estado_interno').map(val => <option key={val} value={val}>{val}</option>)}
                    </select>

                    <select
                        className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-3 py-2 text-slate-300 outline-none focus:border-rose-500"
                        value={filters.tecnico_asignado}
                        onChange={(e) => handleFilterChange('tecnico_asignado', e.target.value)}
                    >
                        <option value="">Todos los Técnicos</option>
                        {getUniqueValues('tecnico_asignado').map(val => <option key={val} value={val}>{val}</option>)}
                    </select>

                    <select
                        className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-3 py-2 text-slate-300 outline-none focus:border-rose-500"
                        value={filters.vendedor}
                        onChange={(e) => handleFilterChange('vendedor', e.target.value)}
                    >
                        <option value="">Todos los Vendedores</option>
                        {getUniqueValues('vendedor').map(val => <option key={val} value={val}>{val}</option>)}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-900 text-slate-400 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-3">Siniestro / Póliza</th>
                                <th className="px-6 py-3">Fecha Ocurrencia</th>
                                <th className="px-6 py-3 text-rose-400">Prescribe En</th>
                                <th className="px-6 py-3 text-rose-400">Fecha Límite</th>
                                <th className="px-6 py-3">Estado</th>
                                <th className="px-6 py-3">Responsables</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {riskClaims.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        No se encontraron casos con los filtros actuales
                                    </td>
                                </tr>
                            ) : (
                                riskClaims.map((claim) => {
                                    const color = getPhaseColor(claim.estado_interno);
                                    const prescriptionDate = getPrescriptionDate(claim.fecha_ocurrencia);
                                    const daysToPrescription = Math.ceil((prescriptionDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                                    return (
                                        <tr
                                            key={claim.id_softseguros}
                                            className="hover:bg-slate-700/50 transition-colors cursor-pointer group"
                                            onClick={() => onSelectClaim(claim)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-white">{claim.numero_siniestro}</div>
                                                <div className="text-slate-500 text-xs">{claim.asegurado}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">
                                                {new Date(claim.fecha_ocurrencia).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-rose-400">
                                                {daysToPrescription} días
                                            </td>
                                            <td className="px-6 py-4 text-rose-300/70 text-xs">
                                                {prescriptionDate.toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium border border-transparent bg-${color}-900/30 text-${color}-200 border-${color}-800`}>
                                                    {claim.estado_interno}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-400">
                                                <div>T: {claim.tecnico_asignado}</div>
                                                <div>V: {claim.vendedor}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PrescriptionRiskPage;
