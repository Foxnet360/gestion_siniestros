import React from 'react';
import { Claim, InternalState, Priority, StateHistoryEntry } from '../../types';
import { WORKFLOW_PHASES } from '../../constants';
import { Clock, History } from 'lucide-react';
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

  return (
    <div className="flex-1 p-8 bg-white dark:bg-slate-900 overflow-y-auto">
      <h3 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-6">Gestión</h3>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="col-span-2 md:col-span-1">
          <StateSelector
            claim={claim}
            formData={formData}
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
    </div>
  );
};

/**
 * Selector de Estado con badge de días
 */
const StateSelector: React.FC<{
  claim: Claim;
  formData: Claim;
  daysInCurrentState: number;
  onStateChange: (newState: InternalState) => void;
}> = ({ claim, formData, daysInCurrentState, onStateChange }) => {
  const isStagnant = daysInCurrentState > STAGNANT_THRESHOLD_DAYS;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Estado Interno
        </label>
        <div
          className={`flex items-center text-xs font-bold px-2 py-0.5 rounded border ${
            isStagnant
              ? 'bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800'
              : 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
          }`}
        >
          <Clock className="w-3 h-3 mr-1" />
          {daysInCurrentState} días
        </div>
      </div>
      <select
        value={formData.estado_interno}
        onChange={e => onStateChange(e.target.value as InternalState)}
        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none"
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
      <button className="flex items-center text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors mb-2">
        <History className="w-3 h-3 mr-1" /> Historial de Tiempos
      </button>
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-[10px] text-left">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
            <tr>
              <th className="p-2 font-medium">Estado</th>
              <th className="p-2 font-medium text-right">Días</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
            {history.slice(0, 3).map((entry, i) => (
              <tr key={i} className="text-slate-600 dark:text-slate-300">
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
    if (!isSelected)
      return 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700';

    switch (p) {
      case Priority.ALTA:
        return 'bg-rose-100 dark:bg-rose-900/50 border-rose-500 text-rose-700 dark:text-rose-200';
      case Priority.MEDIA:
        return 'bg-amber-100 dark:bg-amber-900/50 border-amber-500 text-amber-700 dark:text-amber-200';
      case Priority.BAJA:
        return 'bg-blue-100 dark:bg-blue-900/50 border-blue-500 text-blue-700 dark:text-blue-200';
      default:
        return 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400';
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
        Prioridad
      </label>
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
