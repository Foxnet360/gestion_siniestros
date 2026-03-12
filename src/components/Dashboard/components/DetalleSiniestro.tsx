import React from 'react';
import { X, Clock, Calendar, User, FileText, CheckCircle } from 'lucide-react';

interface EtapaDetalle {
  numero: number;
  nombre: string;
  fechaEntrada: string;
  fechaSalida?: string;
  diasHabiles: number;
  estado: 'completada' | 'en_progreso' | 'pendiente';
}

interface DetalleSiniestroProps {
  claimId: string;
  etapas: EtapaDetalle[];
  onCerrar: () => void;
}

export const DetalleSiniestro: React.FC<DetalleSiniestroProps> = ({
  claimId,
  etapas,
  onCerrar,
}) => {
  const etapasCompletadas = etapas.filter(e => e.estado === 'completada');
  const etapaActual = etapas.find(e => e.estado === 'en_progreso');
  const diasTotales = etapas.reduce((sum, e) => sum + e.diasHabiles, 0);

  const getEstadoColor = (estado: string): string => {
    switch (estado) {
      case 'completada':
        return 'bg-green-500';
      case 'en_progreso':
        return 'bg-blue-500';
      default:
        return 'bg-slate-600';
    }
  };

  const formatFecha = (fecha: string): string => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Detalle del Siniestro</h2>
            <p className="text-slate-400 text-sm mt-1">ID: {claimId}</p>
          </div>
          <button
            onClick={onCerrar}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Resumen */}
        <div className="p-6 border-b border-slate-700 bg-slate-800/50">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-1">
                <Clock className="w-4 h-4" />
                <span>Días Totales</span>
              </div>
              <p className="text-2xl font-bold text-slate-100">{diasTotales}</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-1">
                <CheckCircle className="w-4 h-4" />
                <span>Etapas Completadas</span>
              </div>
              <p className="text-2xl font-bold text-green-400">{etapasCompletadas.length}/16</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-1">
                <FileText className="w-4 h-4" />
                <span>Etapa Actual</span>
              </div>
              <p className="text-2xl font-bold text-blue-400">{etapaActual?.numero || '-'}</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-1">
                <User className="w-4 h-4" />
                <span>Estado</span>
              </div>
              <p className="text-2xl font-bold text-slate-100">
                {etapaActual ? 'En Progreso' : 'Completado'}
              </p>
            </div>
          </div>
        </div>

        {/* Línea de tiempo */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Línea de Tiempo</h3>

          <div className="space-y-4">
            {etapas.map((etapa, index) => (
              <div key={etapa.numero} className="flex gap-4">
                {/* Línea vertical */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${getEstadoColor(etapa.estado)}`}
                  >
                    {etapa.numero}
                  </div>
                  {index < etapas.length - 1 && <div className="w-0.5 flex-1 bg-slate-700 my-2" />}
                </div>

                {/* Contenido */}
                <div className="flex-1 pb-6">
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-slate-100 font-medium">{etapa.nombre}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Calendar className="w-3 h-3" />
                            Entrada: {formatFecha(etapa.fechaEntrada)}
                          </span>

                          {etapa.fechaSalida && (
                            <span className="flex items-center gap-1 text-slate-400">
                              <Calendar className="w-3 h-3" />
                              Salida: {formatFecha(etapa.fechaSalida)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-2xl font-bold text-slate-100">
                          {etapa.diasHabiles}d
                        </span>
                        <p className="text-slate-400 text-xs">días hábiles</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex justify-end">
          <button
            onClick={onCerrar}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
