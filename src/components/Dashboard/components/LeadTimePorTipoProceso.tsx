import React from 'react';
import { SegmentoData } from '../../../services/EficienciaEtapasService';
import { Clock, FileText, Calendar, AlertCircle } from 'lucide-react';

interface LeadTimePorTipoProcesoProps {
  segmentos: SegmentoData[];
}

export const LeadTimePorTipoProceso: React.FC<LeadTimePorTipoProcesoProps> = ({ segmentos }) => {
  const formatDias = (dias: number): string => {
    if (dias < 30) return `${dias} días`;
    if (dias < 365) return `${Math.round(dias / 30)} meses`;
    return `${Math.round((dias / 365) * 10) / 10} años`;
  };

  const getTipoProcesoInfo = (tipo: string) => {
    switch (tipo) {
      case 'normal':
        return {
          label: 'Procesos Normales',
          descripcion: '30-90 días típicos',
          icon: FileText,
          color: 'bg-green-500/20 text-green-400',
          borderColor: 'border-green-500/30',
        };
      case 'prescripcion_ordinaria':
        return {
          label: 'Prescripción Ordinaria',
          descripcion: '~2 años de espera',
          icon: Calendar,
          color: 'bg-yellow-500/20 text-yellow-400',
          borderColor: 'border-yellow-500/30',
        };
      case 'prescripcion_extraordinaria':
        return {
          label: 'Prescripción Extraordinaria',
          descripcion: '~5 años de espera',
          icon: AlertCircle,
          color: 'bg-red-500/20 text-red-400',
          borderColor: 'border-red-500/30',
        };
      default:
        return {
          label: tipo,
          descripcion: 'Tipo desconocido',
          icon: Clock,
          color: 'bg-slate-500/20 text-slate-400',
          borderColor: 'border-slate-500/30',
        };
    }
  };

  // Ordenar: normal primero, luego prescripciones
  const segmentosOrdenados = [...segmentos].sort((a, b) => {
    const orden = { normal: 0, prescripcion_ordinaria: 1, prescripcion_extraordinaria: 2 };
    return (orden[a.id as keyof typeof orden] || 3) - (orden[b.id as keyof typeof orden] || 3);
  });

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-slate-100 mb-4">Lead Time por Tipo de Proceso</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {segmentosOrdenados.map(segmento => {
          const info = getTipoProcesoInfo(segmento.id);
          const Icon = info.icon;

          return (
            <div
              key={segmento.id}
              className={`bg-slate-800 rounded-xl border ${info.borderColor} p-4`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${info.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-2xl font-bold text-slate-100">{segmento.cantidad}</span>
              </div>

              <h3 className="text-slate-100 font-medium">{info.label}</h3>
              <p className="text-slate-400 text-sm">{info.descripcion}</p>

              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Promedio:</span>
                  <span className="text-slate-100 font-semibold">
                    {formatDias(segmento.leadTimeAvg)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-slate-400 text-sm">P90:</span>
                  <span className="text-slate-100 font-semibold">
                    {formatDias(segmento.leadTimeP90)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
