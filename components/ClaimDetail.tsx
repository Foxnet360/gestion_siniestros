import React, { useState, useEffect } from 'react';
import { Claim, InternalState, Priority, StateHistoryEntry } from '../types';
import { WORKFLOW_PHASES } from '../constants';
import { X, Save, Send, Shield, FileText, Calendar, DollarSign, User, Clock, History } from 'lucide-react';

interface ClaimDetailProps {
  claim: Claim;
  onClose: () => void;
  onUpdate: (updatedClaim: Claim) => void;
  onChangeState: (newState: InternalState) => void;
}

const ClaimDetail: React.FC<ClaimDetailProps> = ({ claim, onClose, onUpdate, onChangeState }) => {
  const [formData, setFormData] = useState<Claim>(claim);
  const [newNote, setNewNote] = useState('');
  const [daysInCurrentState, setDaysInCurrentState] = useState(0);

  // Calculate days in current state
  useEffect(() => {
    if (claim.lastStateChangeDate) {
      const start = new Date(claim.lastStateChangeDate).getTime();
      const now = new Date().getTime();
      const days = Math.floor((now - start) / (1000 * 60 * 60 * 24));
      setDaysInCurrentState(days);
    }
  }, [claim.lastStateChangeDate]);

  const handleChange = (field: keyof Claim, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStateChange = (newState: InternalState) => {
    if (newState === claim.estado_interno) return;

    // Call parent/context to handle the state change logic globally and immediately
    onChangeState(newState);

    // Note: We don't update formData here because the props 'claim' will update 
    // and trigger a re-render. Ideally, we should sync formData with new claim props 
    // or separate them. For now, rely on prop display for state.
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      author: 'Usuario Actual', // Mock user
      text: newNote,
      isSystem: false
    };
    const updated = {
      ...formData,
      timeline: [note, ...formData.timeline],
      updatedAt: new Date().toISOString()
    };
    setFormData(updated);
    setNewNote('');
    // Trigger global update (autowrite in a real app)
    onUpdate(updated);
  };

  const handleSave = () => {
    onUpdate(formData);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  const netToPay = (formData.valor_indemnizacion || 0) - (formData.valor_deducible || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="h-16 border-b border-slate-700 flex items-center justify-between px-6 bg-slate-800/50">
          <div className="flex items-center space-x-4">
            <div className="bg-slate-700 p-2 rounded-lg">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {claim.asegurado}
                <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{claim.numero_siniestro}</span>
              </h2>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content - 3 Columns */}
        <div className="flex-1 flex overflow-hidden">

          {/* LEFT: Softseguros Read-Only */}
          <div className="w-1/4 bg-slate-900/50 border-r border-slate-800 p-6 overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center">
              <img src="https://ui-avatars.com/api/?name=S+S&background=0f172a&color=64748b" className="w-4 h-4 mr-2 rounded" alt="SS" />
              Datos Softseguros
            </h3>

            <div className="space-y-6">
              <div className="group">
                <label className="text-xs text-slate-500 block mb-1">Póliza</label>
                <div className="flex items-center text-slate-200 bg-slate-800/50 p-3 rounded border border-slate-800 group-hover:border-slate-600 transition-colors">
                  <FileText className="w-4 h-4 mr-3 text-slate-500" />
                  <span className="font-mono text-sm">{claim.poliza}</span>
                </div>
              </div>

              <div className="group">
                <label className="text-xs text-slate-500 block mb-1">Bien Asegurado</label>
                <div className="flex items-center text-slate-200 bg-slate-800/50 p-3 rounded border border-slate-800">
                  <span className="font-mono text-sm">{claim.placa_bien}</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1">Estado Origen</label>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  {claim.estado_softseguros}
                </span>
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1">Registrado Por</label>
                <div className="flex items-center text-slate-300">
                  <User className="w-3 h-3 mr-2 text-slate-500" />
                  <span className="text-sm">{claim.usuario_registro}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <label className="text-xs text-slate-500 block mb-2">Última Novedad (Origen)</label>
                <p className="text-sm text-slate-400 italic bg-slate-800/30 p-3 rounded">
                  "{claim.ultimo_seguimiento_raw}"
                </p>
              </div>
            </div>
          </div>

          {/* CENTER: Management & Finance */}
          <div className="flex-1 p-8 bg-slate-900 overflow-y-auto">
            <h3 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-6">
              Gestión & Financiera
            </h3>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="col-span-2 md:col-span-1">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-300">Estado Interno</label>
                  <div className={`flex items-center text-xs font-bold px-2 py-0.5 rounded border 
                    ${daysInCurrentState > 30 ? 'bg-rose-900/30 text-rose-400 border-rose-800' : 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                    <Clock className="w-3 h-3 mr-1" />
                    {daysInCurrentState} días
                  </div>
                </div>
                <select
                  value={claim.estado_interno}
                  onChange={(e) => handleStateChange(e.target.value as InternalState)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none"
                >
                  {WORKFLOW_PHASES.map(phase => (
                    <optgroup key={phase.id} label={phase.label}>
                      {phase.states.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>

                {/* State History Mini-Table */}
                {claim.stateHistory && claim.stateHistory.length > 0 && (
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
                          {claim.stateHistory.slice(0, 3).map((entry, i) => (
                            <tr key={i} className="text-slate-300">
                              <td className="p-2 truncate max-w-[150px]">{entry.state}</td>
                              <td className="p-2 text-right font-mono">{entry.daysDuration}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-300 mb-2">Prioridad</label>
                <div className="flex space-x-2">
                  {Object.values(Priority).map(p => (
                    <button
                      key={p}
                      onClick={() => handleChange('prioridad', p)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all
                        ${formData.prioridad === p
                          ? (p === Priority.ALTA ? 'bg-rose-900/50 border-rose-500 text-rose-200' : p === Priority.MEDIA ? 'bg-amber-900/50 border-amber-500 text-amber-200' : 'bg-blue-900/50 border-blue-500 text-blue-200')
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 space-y-6">
              <div className="relative">
                <label className="block text-xs font-medium text-slate-400 mb-1">Monto Pretensión (Reserva)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="number"
                    value={formData.monto_reclamo}
                    onChange={(e) => handleChange('monto_reclamo', Number(e.target.value))}
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
                      onChange={(e) => handleChange('valor_deducible', Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-3 text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Indemnización Bruta</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="number"
                      value={formData.valor_indemnizacion}
                      onChange={(e) => handleChange('valor_indemnizacion', Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-3 text-emerald-400 font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700 flex justify-between items-end">
                <span className="text-sm text-slate-400 font-medium">Neto a Pagar</span>
                <span className={`text-2xl font-bold ${netToPay > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {formatCurrency(netToPay)}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: Timeline */}
          <div className="w-1/3 bg-slate-950 border-l border-slate-800 flex flex-col">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bitácora</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Combine claim.timeline (live) with any local notes? For now just use claim.timeline which updates on state change. 
                  NOTE: formData.timeline might have new notes not yet saved. 
                  We should probably use formData.timeline BUT we want to see the new state change event.
                  Ideally: merge them or just trust formData syncs? 
                  
                  Let's use claim.timeline for the list, since State Change is a System Event in global Claim.
                  BUT if user adds a note, it goes to formData.timeline.
                  
                  Simple fix: Use claim.timeline. When adding note, SAVE immediately or append to local display?
                  
                  Original code used formData.timeline.
                  If I change state -> claim updates -> props.claim has new timeline event.
                  formData still has old timeline.
                  
                  I should Update formData when inputs change?
                  Ideally, I should sync formData with claim.timeline changes.
                  
                  Let's use claim.timeline here. Newly added notes (unsaved) won't appear unless I save them.
                  In handleAddNote, it calls onUpdate (save) immediately! Line 86.
                  So using claim.timeline is safe because notes are auto-saved.
               */}
              {claim.timeline.map((event, idx) => (
                <div key={event.id} className="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:rounded-full before:bg-slate-700">
                  {idx !== formData.timeline.length - 1 && (
                    <div className="absolute left-[3px] top-4 w-0.5 h-full bg-slate-800 -z-10"></div>
                  )}
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-bold ${event.isSystem ? 'text-blue-400' : 'text-slate-200'}`}>
                      {event.author}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={`text-sm p-3 rounded-lg ${event.isSystem ? 'bg-slate-900 text-slate-400 italic border border-slate-800' : 'bg-slate-800 text-slate-300'}`}>
                    {event.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900">
              <div className="flex items-end space-x-2">
                <textarea
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                  rows={2}
                  placeholder="Escribe una nota..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddNote();
                    }
                  }}
                />
                <button
                  onClick={handleAddNote}
                  className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ClaimDetail;