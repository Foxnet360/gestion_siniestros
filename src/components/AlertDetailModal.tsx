import React from 'react';
import { Claim } from '../types';
import { AlertLevel } from './AlertBadge';
import {
  X,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Calendar,
  User,
  FileText,
  ArrowRight,
} from 'lucide-react';

interface AlertDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  claim: Claim | null;
  alertLevel: AlertLevel;
  daysRemaining?: number;
}

/**
 * Modal que muestra los detalles completos de una alerta
 * Incluye información del siniestro, fechas relevantes y acciones sugeridas
 */
export const AlertDetailModal: React.FC<AlertDetailModalProps> = ({
  isOpen,
  onClose,
  claim,
  alertLevel,
  daysRemaining,
}) => {
  if (!isOpen || !claim) return null;

  const getAlertDetails = (level: AlertLevel, days?: number) => {
    switch (level) {
      case 'critical':
        return {
          title: days && days <= 0 ? '⚠️ Prescripción Vencida' : '🚨 Alerta Crítica',
          description:
            days && days <= 0
              ? 'El siniestro ha alcanzado su fecha de prescripción y debe ser cerrado inmediatamente.'
              : `El siniestro está a ${days} días de vencer su prescripción. Requiere acción inmediata.`,
          color: 'red',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          iconColor: 'text-red-600 dark:text-red-400',
          actions: [
            'Revisar documentación pendiente',
            'Contactar a la compañía aseguradora',
            'Evaluar cierre o extensión',
            'Actualizar estado en el sistema',
          ],
        };

      case 'warning':
        return {
          title: '⚠️ Advertencia',
          description: `El siniestro vencerá en ${days} días. Se recomienda iniciar gestiones de cierre.`,
          color: 'amber',
          bgColor: 'bg-amber-50 dark:bg-amber-900/20',
          borderColor: 'border-amber-200 dark:border-amber-800',
          iconColor: 'text-amber-600 dark:text-amber-400',
          actions: [
            'Revisar estado actual del siniestro',
            'Verificar documentación completa',
            'Preparar cierre si es posible',
          ],
        };

      case 'legal_stagnation_critical':
        return {
          title: '⚖️ Estancamiento Jurídico Crítico',
          description:
            'El proceso jurídico lleva más de 4.5 años sin actividad significativa. Se procederá al cierre automático próximamente.',
          color: 'rose',
          bgColor: 'bg-rose-50 dark:bg-rose-900/20',
          borderColor: 'border-rose-200 dark:border-rose-800',
          iconColor: 'text-rose-600 dark:text-rose-400',
          actions: [
            'Revisar últimas actuaciones judiciales',
            'Contactar abogado externo',
            'Evaluar posible reactivación',
            'Preparar cierre por estancamiento',
          ],
        };

      case 'legal_stagnation_warning':
        return {
          title: '⚖️ Estancamiento Jurídico',
          description:
            'El proceso jurídico lleva más de 2 años sin actividad. Se recomienda revisar el caso.',
          color: 'orange',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          borderColor: 'border-orange-200 dark:border-orange-800',
          iconColor: 'text-orange-600 dark:text-orange-400',
          actions: [
            'Revisar últimas actuaciones',
            'Contactar al abogado del caso',
            'Evaluar estado del proceso',
          ],
        };

      case 'resolved':
        return {
          title: '✅ Siniestro Resuelto',
          description: 'Este siniestro ha sido finalizado y no requiere acciones adicionales.',
          color: 'emerald',
          bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
          borderColor: 'border-emerald-200 dark:border-emerald-800',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          actions: ['Archivar documentación', 'Cerrar expediente físico'],
        };

      default:
        return {
          title: 'ℹ️ Información',
          description: 'No hay alertas activas para este siniestro.',
          color: 'slate',
          bgColor: 'bg-slate-50 dark:bg-slate-800',
          borderColor: 'border-slate-200 dark:border-slate-700',
          iconColor: 'text-slate-600 dark:text-slate-400',
          actions: [],
        };
    }
  };

  const details = getAlertDetails(alertLevel, daysRemaining);

  const colorClasses = {
    red: {
      headerBg: 'bg-red-600',
      buttonBg: 'bg-red-600 hover:bg-red-700',
    },
    amber: {
      headerBg: 'bg-amber-600',
      buttonBg: 'bg-amber-600 hover:bg-amber-700',
    },
    rose: {
      headerBg: 'bg-rose-600',
      buttonBg: 'bg-rose-600 hover:bg-rose-700',
    },
    orange: {
      headerBg: 'bg-orange-600',
      buttonBg: 'bg-orange-600 hover:bg-orange-700',
    },
    emerald: {
      headerBg: 'bg-emerald-600',
      buttonBg: 'bg-emerald-600 hover:bg-emerald-700',
    },
    slate: {
      headerBg: 'bg-slate-600',
      buttonBg: 'bg-slate-600 hover:bg-slate-700',
    },
  };

  const colors = colorClasses[details.color as keyof typeof colorClasses];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className={`${colors.headerBg} text-white p-6 rounded-t-2xl`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {alertLevel === 'critical' && <AlertOctagon className="w-8 h-8" />}
              {alertLevel === 'warning' && <AlertTriangle className="w-8 h-8" />}
              {(alertLevel === 'legal_stagnation_critical' ||
                alertLevel === 'legal_stagnation_warning') && <Clock className="w-8 h-8" />}
              <div>
                <h2 className="text-xl font-bold">{details.title}</h2>
                <p className="text-white/80 text-sm mt-1">Siniestro {claim.numero_siniestro}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Descripción */}
          <div className={`p-4 rounded-lg ${details.bgColor} border ${details.borderColor}`}>
            <p className={`${details.iconColor} font-medium`}>{details.description}</p>
          </div>

          {/* Información del Siniestro */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              Información del Siniestro
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-sm text-slate-500 dark:text-slate-400">Asegurado</p>
                <p className="font-medium text-slate-800 dark:text-slate-100">{claim.asegurado}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-sm text-slate-500 dark:text-slate-400">Póliza</p>
                <p className="font-medium text-slate-800 dark:text-slate-100">{claim.poliza}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-sm text-slate-500 dark:text-slate-400">Ramo</p>
                <p className="font-medium text-slate-800 dark:text-slate-100">{claim.ramo}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-sm text-slate-500 dark:text-slate-400">Estado</p>
                <p className="font-medium text-slate-800 dark:text-slate-100">
                  {claim.estado_interno}
                </p>
              </div>
            </div>
          </div>

          {/* Fechas Relevantes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-400" />
              Fechas Relevantes
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {claim.fecha_ocurrencia && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Fecha de Ocurrencia</p>
                  <p className="font-medium text-slate-800 dark:text-slate-100">
                    {new Date(claim.fecha_ocurrencia).toLocaleDateString('es-CO')}
                  </p>
                </div>
              )}

              {claim.fecha_prescripcion_ordinaria && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Prescripción Ordinaria
                  </p>
                  <p className="font-medium text-slate-800 dark:text-slate-100">
                    {new Date(claim.fecha_prescripcion_ordinaria).toLocaleDateString('es-CO')}
                  </p>
                </div>
              )}

              {claim.fecha_prescripcion_extraordinaria && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Prescripción Extraordinaria
                  </p>
                  <p className="font-medium text-slate-800 dark:text-slate-100">
                    {new Date(claim.fecha_prescripcion_extraordinaria).toLocaleDateString('es-CO')}
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    Responsabilidad Civil - 5 años
                  </p>
                </div>
              )}

              {claim.proximo_seguimiento && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-600 dark:text-blue-400">Próximo Seguimiento</p>
                  <p className="font-medium text-blue-800 dark:text-blue-300">
                    {new Date(claim.proximo_seguimiento).toLocaleDateString('es-CO')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Acciones Recomendadas */}
          {details.actions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-slate-400" />
                Acciones Recomendadas
              </h3>

              <ul className="space-y-2">
                {details.actions.map((action, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <span
                      className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${colors.buttonBg.split(' ')[0]}`}
                    />
                    <span className="text-slate-700 dark:text-slate-300">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cerrar
            </button>

            <a
              href={`/siniestros/${claim.id_softseguros}`}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${colors.buttonBg}`}
            >
              Ver Siniestro
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertDetailModal;
