import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { useClaims } from '../context/ClaimsContext';

const FilterBar: React.FC = () => {
    const { filters, setFilters, claims } = useClaims();

    // Compute unique options for dropdowns
    const uniqueRamos = Array.from(new Set(claims.map(c => c.ramo))).filter((x): x is string => !!x).sort();
    const uniqueAseguradoras = Array.from(new Set(claims.map(c => c.aseguradora))).filter((x): x is string => !!x).sort();
    const uniqueEstados = Array.from(new Set(claims.map(c => c.estado_interno))).filter((x): x is string => !!x).sort();
    const uniqueTecnicos = Array.from(new Set(claims.map(c => c.tecnico_asignado))).filter((x): x is string => !!x).sort();

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters({ ...filters, searchTerm: e.target.value });
    };

    const toggleFilter = (key: keyof typeof filters, value: string) => {
        const current = filters[key] as string[];
        const updated = current.includes(value)
            ? current.filter(item => item !== value)
            : [...current, value];
        setFilters({ ...filters, [key]: updated });
    };

    const clearFilters = () => {
        setFilters({
            searchTerm: '',
            ramo: [],
            aseguradora: [],
            estado: [],
            tecnico: [],
            aliado: []
        });
    };

    const FilterDropdown = ({ title, options, filterKey }: { title: string, options: string[], filterKey: keyof typeof filters }) => {
        const selected = filters[filterKey] as string[];
        return (
            <div className="relative group">
                <button className={`flex items-center space-x-1 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${selected.length > 0 ? 'bg-blue-900/30 border-blue-500/50 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'}`}>
                    <span>{title}</span>
                    {selected.length > 0 && <span className="bg-blue-500 text-white text-[9px] px-1 rounded-full">{selected.length}</span>}
                </button>
                {/* Dropdown Content - Simplified for prototype, ideally use a Popover component */}
                <div className="absolute top-full left-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-2 hidden group-hover:block z-50">
                    <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-600">
                        {options.map(opt => (
                            <label key={opt} className="flex items-center space-x-2 px-2 py-1 hover:bg-slate-700 rounded cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selected.includes(opt)}
                                    onChange={() => toggleFilter(filterKey, opt)}
                                    className="rounded bg-slate-900 border-slate-600 text-blue-500 focus:ring-0"
                                />
                                <span className="text-xs text-slate-300 truncate">{opt}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-10 px-8 py-4 mb-6 -mx-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar por Siniestro, Póliza, Placa, Asegurado..."
                        value={filters.searchTerm}
                        onChange={handleSearch}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                    />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center text-slate-500 text-xs uppercase tracking-wider font-bold mr-2">
                        <Filter className="w-3 h-3 mr-1" /> Filters:
                    </div>

                    <FilterDropdown title="Ramo" options={uniqueRamos} filterKey="ramo" />
                    <FilterDropdown title="Aseguradora" options={uniqueAseguradoras} filterKey="aseguradora" />
                    <FilterDropdown title="Estado" options={uniqueEstados} filterKey="estado" />
                    <FilterDropdown title="Técnico" options={uniqueTecnicos} filterKey="tecnico" />

                    {(filters.ramo.length > 0 || filters.aseguradora.length > 0 || filters.estado.length > 0 || filters.tecnico.length > 0 || filters.searchTerm) && (
                        <button
                            onClick={clearFilters}
                            className="ml-2 text-xs text-rose-400 hover:text-rose-300 flex items-center hover:underline"
                        >
                            <X className="w-3 h-3 mr-0.5" /> Limpiar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
