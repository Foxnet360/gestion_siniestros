import React from 'react';
import { Claim, InternalState, Priority, StateHistoryEntry } from '../../types';
import { WORKFLOW_PHASES } from '../../constants';
import { Clock, History, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { getDaysSinceLastChange, STAGNANT_THRESHOLD_DAYS } from '../../utils/claimUtils';

interface ManagementPanelProps {
  claim: Claim;
  formData: Claim;
  onChange: (field: keyof Claim, value: any) => void;
  onStateChange: (newState: InternalState) => void;
}

/**
 * Panel de Gestión y Financiera
 * Contiene formularios para editar datos internos del claim
 */
export const ManagementPanel: React.FC<ManagementPanelProps> = ({
  claim,
  formData,
  onChange,
  onStateChange,
}) => {
  const daysInCurrentState = getDaysSinceLastChange(claim);
  const netToPay = (formData.valor_indemnizacion || 0) - (formData.valor_deducible || 0);

  return (
    <div className="flex-1 p-8 bg-slate-900 overflow-y-auto">
      <h3 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-6">
        Gestión & Financiera
      </h3>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="col-span-2 md:col-span-1">
          <StateSelector
            claim={claim}
            daysInCurrentState={daysInCurrentState}
            onStateChange={onStateChange}
          />

          {claim.stateHistory && claim.stateHistory.length > 0 && (
            <StateHistoryTable history={claim.stateHistory} />
          )}
        </div>

        <div className="col-span-2 md:col-span-1">
          <PrioritySelector priority={formData.prioridad} onChange={onChange} />
        </div>
      </div>

      <FinancialForm formData={formData} onChange={onChange} netToPay={netToPay} />
    </div>
  );
};

/**
 * Selector de Estado con badge de días
 */
const StateSelector: React.FC<{
  claim: Claim;
  daysInCurrentState: number;
  onStateChange: (newState: InternalState) => void;
}> = ({ claim, daysInCurrentState, onStateChange }) => {
  const isStagnant = daysInCurrentState > STAGNANT_THRESHOLD_DAYS;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-slate-300">Estado Interno</label>
        <div
          className={`flex items-center text-xs font-bold px-2 py-0.5 rounded border ${
            isStagnant
              ? 'bg-rose-900/30 text-rose-400 border-rose-800'
              : 'bg-slate-700 text-slate-300 border-slate-600'
          }`}
        >
          <Clock className="w-3 h-3 mr-1" />
          {daysInCurrentState} días
        </div>
      </div>
      <select
        value={claim.estado_interno}
        onChange={e => onStateChange(e.target.value as InternalState)}
        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none"
      >
        {WORKFLOW_PHASES.map(phase => (
          <optgroup key={phase.id} label={phase.label}>
            {phase.states.map(state => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
};

/**
 * Tabla de historial de estados
 */
const StateHistoryTable: React.FC<{ history: StateHistoryEntry[] }> = ({ history }) => {
  return (
    <div className="mt-3">
      <button className="flex items-center text-xs text-slate-500 hover:text-slate-300 transition-colors mb-2">
        <History className="w-3 h-3 mr-1" /> Historial de Tiempos
      </button>
      <div className="bg-slate-800/50 rounded border border-slate-700 overflow-hidden">
        <table className="w-full text-[10px] text-left">
          <thead className="bg-slate-800 text-slate-400">
            <tr>
              <th className="p-2 font-medium">Estado</th>
              <th className="p-2 font-medium text-right">Días</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {history.slice(0, 3).map((entry, i) => (
              <tr key={i} className="text-slate-300">
                <td className="p-2 truncate max-w-[150px]">{entry.state}</td>
                <td className="p-2 text-right font-mono">{entry.daysDuration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Selector de Prioridad
 */
const PrioritySelector: React.FC<{
  priority: Priority;
  onChange: (field: keyof Claim, value: any) => void;
}> = ({ priority, onChange }) => {
  const getPriorityClasses = (p: Priority, isSelected: boolean) => {
    if (!isSelected) return 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700';

    switch (p) {
      case Priority.ALTA:
        return 'bg-rose-900/50 border-rose-500 text-rose-200';
      case Priority.MEDIA:
        return 'bg-amber-900/50 border-amber-500 text-amber-200';
      case Priority.BAJA:
        return 'bg-blue-900/50 border-blue-500 text-blue-200';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-400';
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">Prioridad</label>
      <div className="flex space-x-2">
        {Object.values(Priority).map(p => (
          <button
            key={p}
            onClick={() => onChange('prioridad', p)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${getPriorityClasses(p, priority === p)}`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * Formulario Financiero
 */
const FinancialForm: React.FC<{
  formData: Claim;
  onChange: (field: keyof Claim, value: any) => void;
  netToPay: number;
}> = ({ formData, onChange, netToPay }) => {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 space-y-6">
      <div className="relative">
        <label className="block text-xs font-medium text-slate-400 mb-1">
          Monto Pretensión (Reserva)
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="number"
            value={formData.monto_reclamo}
            onChange={e => onChange('monto_reclamo', Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-3 text-slate-100 placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Deducible</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="number"
              value={formData.valor_deducible}
              onChange={e => onChange('valor_deducible', Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-3 text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Indemnización Bruta
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="number"
              value={formData.valor_indemnizacion}
              onChange={e => onChange('valor_indemnizacion', Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-3 text-emerald-400 font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-700 flex justify-between items-end">
        <span className="text-sm text-slate-400 font-medium">Neto a Pagar</span>
        <span
          className={`text-2xl font-bold ${
            netToPay > 0 ? 'text-emerald-400' : 'text-slate-500'
          }`}
        >
          {formatCurrency(netToPay)}
        </span>
      </div>
    </div>
  );
};
