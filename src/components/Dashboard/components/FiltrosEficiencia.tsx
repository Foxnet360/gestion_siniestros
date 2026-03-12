import React from 'react';
import { FiltrosEficienciaEtapas } from '../../../services/EficienciaEtapasService';
import { X } from 'lucide-react';

interface FiltrosEficienciaProps {
  filtros: FiltrosEficienciaEtapas;
  options: {
    aseguradoras: Array<{ id: string; nombre: string }>;
    ramos: Array<{ id: string; nombre: string }>;
    tecnicos: Array<{ id: string; nombre: string }>;
  };
  loading: boolean;
  onUpdateFiltro: <K extends keyof FiltrosEficienciaEtapas>(key: K, value: FiltrosEficienciaEtapas[K]) => void;
  onAplicar: () => void;
  onLimpiar: () => void;
  onCerrar: () => void;
}

export const FiltrosEficiencia: React.FC<FiltrosEficienciaProps> = ({
  filtros,
  options,
  loading,
  onUpdateFiltro,
  onAplicar,
  onLimpiar,
  onCerrar,
}) => {
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-slate-800 border-l border-slate-700 shadow-2xl z-50 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-100">Filtros</h2>
          <button
            onClick={onCerrar}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Tipo de Proceso */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Tipo de Proceso</label>
            <select
              value={filtros.tipoProceso || ''}
              onChange={e => onUpdateFiltro('tipoProceso', e.target.value || undefined)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="normal">Normal</option>
              <option value="prescripcion_ordinaria">Prescripción Ordinaria</option>
              <option value="prescripcion_extraordinaria">Prescripción Extraordinaria</option>
            </select>
          </div>

          {/* Aseguradora */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Aseguradora</label>
            <select
              value={filtros.aseguradoraId || ''}
              onChange={e => onUpdateFiltro('aseguradoraId', e.target.value || undefined)}
              disabled={loading}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            >
              <option value="">Todas</option>
              {options.aseguradoras.map(a => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Ramo */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Ramo</label>
            <select
              value={filtros.ramoId || ''}
              onChange={e => onUpdateFiltro('ramoId', e.target.value || undefined)}
              disabled={loading}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            >
              <option value="">Todos</option>
              {options.ramos.map(r => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Técnico */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Técnico</label>
            <select
              value={filtros.tecnicoId || ''}
              onChange={e => onUpdateFiltro('tecnicoId', e.target.value || undefined)}
              disabled={loading}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            >
              <option value="">Todos</option>
              {options.tecnicos.map(t => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Fecha Desde</label>
              <input
                type="date"
                value={filtros.fechaDesde || ''}
                onChange={e => onUpdateFiltro('fechaDesde', e.target.value || undefined)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Fecha Hasta</label>
              <input
                type="date"
                value={filtros.fechaHasta || ''}
                onChange={e => onUpdateFiltro('fechaHasta', e.target.value || undefined)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Valor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Valor Mínimo</label>
              <input
                type="number"
                value={filtros.valorMin || ''}
                onChange={e =>
                  onUpdateFiltro(
                    'valorMin',
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                placeholder="0"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Valor Máximo</label>
              <input
                type="number"
                value={filtros.valorMax || ''}
                onChange={e =>
                  onUpdateFiltro(
                    'valorMax',
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                placeholder="Sin límite"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="mt-8 space-y-3">
          <button
            onClick={onAplicar}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            Aplicar Filtros
          </button>
          <button
            onClick={onLimpiar}
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-lg transition-colors"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>
    </div>
  );
};
