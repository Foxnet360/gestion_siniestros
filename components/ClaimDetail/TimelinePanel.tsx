import React, { useState } from 'react';
import { Claim, TimelineEvent } from '../../types';
import { Calendar, Send } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

interface TimelinePanelProps {
  claim: Claim;
  onAddNote: (note: Omit<TimelineEvent, 'id'>) => void;
  currentUserName?: string;
}

/**
 * Panel de Bitácora / Timeline
 * Muestra el historial de eventos y permite agregar notas
 */
export const TimelinePanel: React.FC<TimelinePanelProps> = ({
  claim,
  onAddNote,
  currentUserName = 'Usuario Actual',
}) => {
  const [newNote, setNewNote] = useState('');

  const handleSubmit = () => {
    if (!newNote.trim()) return;

    onAddNote({
      date: new Date().toISOString(),
      author: currentUserName,
      text: newNote,
      isSystem: false,
    });

    setNewNote('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-1/3 bg-slate-950 border-l border-slate-800 flex flex-col">
      <div className="p-4 border-b border-slate-800 bg-slate-900/50">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bitácora</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {claim.timeline.map((event, idx) => (
          <TimelineItem
            key={event.id}
            event={event}
            isLast={idx === claim.timeline.length - 1}
          />
        ))}
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900">
        <div className="flex items-end space-x-2">
          <textarea
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
            rows={2}
            placeholder="Escribe una nota..."
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={handleSubmit}
            disabled={!newNote.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Item individual del timeline
 */
const TimelineItem: React.FC<{
  event: TimelineEvent;
  isLast: boolean;
}> = ({ event, isLast }) => {
  return (
    <div className="relative pl-6">
      {/* Línea conectora */}
      {!isLast && (
        <div className="absolute left-[3px] top-4 w-0.5 h-full bg-slate-800 -z-10"></div>
      )}

      {/* Punto indicador */}
      <div
        className={`absolute left-0 top-2 w-2 h-2 rounded-full ${
          event.isSystem ? 'bg-blue-500' : 'bg-slate-500'
        }`}
      />

      {/* Contenido */}
      <div className="flex justify-between items-start mb-1">
        <span
          className={`text-xs font-bold ${
            event.isSystem ? 'text-blue-400' : 'text-slate-200'
          }`}
        >
          {event.author}
        </span>
        <span className="text-[10px] text-slate-500 flex items-center">
          <Calendar className="w-3 h-3 mr-1" />
          {formatDate(event.date)}
        </span>
      </div>

      <div
        className={`text-sm p-3 rounded-lg ${
          event.isSystem
            ? 'bg-slate-900 text-slate-400 italic border border-slate-800'
            : 'bg-slate-800 text-slate-300'
        }`}
      >
        {event.text}
      </div>
    </div>
  );
};
