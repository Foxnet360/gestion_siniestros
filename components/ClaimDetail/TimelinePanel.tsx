import React from 'react';
import { Claim, TimelineEvent } from '../../types';
import { Calendar, Clock, FileText, MessageSquare, Info } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

interface TimelinePanelProps {
  claim: Claim;
}

/**
 * Panel de Bitácora / Timeline (Solo lectura)
 * Muestra el historial de eventos provenientes de Softseguros
 * Incluye la Última Novedad al inicio
 */
export const TimelinePanel: React.FC<TimelinePanelProps> = ({ claim }) => {
  const timeline = claim.timeline || [];

  // Crear item especial para Última Novedad si existe
  const hasUltimaNovedad = !!claim.ultimo_seguimiento_raw;
  const ultimaNovedadItem: TimelineEvent | null = hasUltimaNovedad
    ? {
        id: 'ultima-novedad',
        date: claim.updatedAt || new Date().toISOString(),
        author: 'Softseguros',
        text: claim.ultimo_seguimiento_raw!,
        isSystem: true,
      }
    : null;

  // Combinar: Última Novedad primero, luego el timeline
  const allEvents = ultimaNovedadItem ? [ultimaNovedadItem, ...timeline] : timeline;

  return (
    <div className="h-full bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide">
            Bitácora
          </h3>
        </div>
        <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
          Solo lectura - Datos de Softseguros
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {allEvents.length} {allEvents.length === 1 ? 'registro' : 'registros'}
          {hasUltimaNovedad && ' (incluye Última Novedad)'}
        </p>
      </div>

      {/* Timeline content */}
      <div className="flex-1 overflow-y-auto p-4">
        {allEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Info className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No hay registros en la bitácora</p>
            <p className="text-xs mt-1 opacity-60">Los eventos aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allEvents.map((event, idx) => (
              <TimelineItem
                key={event.id || idx}
                event={event}
                isLast={idx === allEvents.length - 1}
                index={idx + 1}
                isUltimaNovedad={event.id === 'ultima-novedad'}
              />
            ))}
          </div>
        )}
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
  index: number;
  isUltimaNovedad?: boolean;
}> = ({ event, isLast, index, isUltimaNovedad }) => {
  const formattedDate = formatDate(event.date);
  const formattedTime = new Date(event.date).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`relative pl-8 ${isUltimaNovedad ? 'bg-amber-50/50 dark:bg-amber-900/10 -mx-2 px-2 py-2 rounded-lg' : ''}`}
    >
      {/* Línea conectora */}
      {!isLast && (
        <div className="absolute left-[11px] top-8 w-0.5 h-[calc(100%+16px)] bg-slate-300 dark:bg-slate-600" />
      )}

      {/* Número/Nodo */}
      <div
        className={`absolute left-0 top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
          isUltimaNovedad
            ? 'bg-amber-100 border-amber-400 dark:bg-amber-900/30 dark:border-amber-500'
            : 'bg-blue-100 border-blue-400 dark:bg-blue-900/30 dark:border-blue-500'
        }`}
      >
        <span
          className={`text-xs font-bold ${
            isUltimaNovedad
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-blue-600 dark:text-blue-400'
          }`}
        >
          {index}
        </span>
      </div>

      {/* Badge de Última Novedad */}
      {isUltimaNovedad && (
        <div className="absolute -top-1 -right-1">
          <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            ÚLTIMA NOVEDAD
          </span>
        </div>
      )}

      {/* Contenido */}
      <div
        className={`rounded-lg p-3 border ${
          isUltimaNovedad
            ? 'bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700 shadow-sm'
            : 'bg-slate-50 border-slate-200 dark:bg-slate-700/30 dark:border-slate-600'
        }`}
      >
        {/* Header del item */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isUltimaNovedad
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                  : event.isSystem
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
              }`}
            >
              {isUltimaNovedad ? 'Última Novedad' : event.isSystem ? 'Sistema' : 'Usuario'}
            </span>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {event.author}
            </span>
          </div>
        </div>

        {/* Fecha y hora */}
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formattedTime}
          </span>
        </div>

        {/* Texto del evento */}
        <div
          className={`text-sm leading-relaxed p-2 rounded border ${
            isUltimaNovedad
              ? 'bg-white border-amber-200 dark:bg-amber-900/30 dark:border-amber-600 text-slate-800 dark:text-slate-200 font-medium'
              : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-600 text-slate-800 dark:text-slate-200'
          }`}
        >
          <MessageSquare
            className={`w-3 h-3 inline mr-1 ${isUltimaNovedad ? 'text-amber-500' : 'text-slate-400'}`}
          />
          {event.text}
        </div>
      </div>
    </div>
  );
};
