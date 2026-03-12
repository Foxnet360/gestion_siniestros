import React from 'react';
import { DonutChart } from '../charts/DonutChart';
import { TimelineSLA } from '../charts/TimelineSLA';
import { HorizontalBarChart } from '../charts/HorizontalBarChart';
import { AlertTriangle } from 'lucide-react';

interface SLATrackingSectionProps {
  backlog?: {
    abiertos: number;
    finalizados: number;
    total: number;
    byStage?: { stage: number; count: number }[];
  };
  timelineStages?: Array<{
    etapa: number;
    nombre: string;
    estado: 'completado' | 'en_progreso' | 'alerta' | 'excedido';
  }>;
  tiempoPorEtapa?: Array<{
    label: string;
    value: number;
    sla?: number;
  }>;
  hasHistoricalData?: boolean;
  isLoading?: boolean;
}

const defaultStages = [
  { etapa: 1, nombre: 'Aviso', estado: 'completado' as const },
  { etapa: 2, nombre: 'Radicación Compañía', estado: 'completado' as const },
  { etapa: 3, nombre: 'Ajustador', estado: 'completado' as const },
  { etapa: 4, nombre: 'Documentos Adicionales', estado: 'en_progreso' as const },
  { etapa: 5, nombre: 'Asistencia', estado: 'en_progreso' as const },
  { etapa: 6, nombre: 'Liquidación', estado: 'en_progreso' as const },
  { etapa: 7, nombre: 'Objeción', estado: 'alerta' as const },
  { etapa: 8, nombre: 'Reconsideración Liq.', estado: 'alerta' as const },
  { etapa: 9, nombre: 'Reconsideración Obj.', estado: 'excedido' as const },
  { etapa: 10, nombre: 'Desistimiento', estado: 'excedido' as const },
  { etapa: 11, nombre: 'Ratificación Liq.', estado: 'en_progreso' as const },
  { etapa: 12, nombre: 'Ratificación Obj.', estado: 'en_progreso' as const },
  { etapa: 13, nombre: 'Prescripción', estado: 'completado' as const },
  { etapa: 14, nombre: 'Proceso Jurídico', estado: 'completado' as const },
  { etapa: 15, nombre: 'Finalizado', estado: 'completado' as const },
  { etapa: 16, nombre: 'Pagado', estado: 'completado' as const },
];

const defaultTiempoPorEtapa = [
  { label: 'Aviso', value: 1, sla: 3 },
  { label: 'Radicación Cía', value: 2, sla: 3 },
  { label: 'Ajustador', value: 7, sla: 5 },
  { label: 'Doc Adicionales', value: 10, sla: 5 },
  { label: 'Asistencia', value: 5, sla: 5 },
  { label: 'Liquidación', value: 15, sla: 10 },
  { label: 'Objeción', value: 20, sla: 7 },
  { label: 'Recon. Liq.', value: 8, sla: 7 },
  { label: 'Recon. Obj.', value: 12, sla: 7 },
  { label: 'Desistimiento', value: 0, sla: 1 },
  { label: 'Ratif. Liq.', value: 5, sla: 5 },
  { label: 'Ratif. Obj.', value: 5, sla: 5 },
  { label: 'Prescripción', value: 0, sla: 1 },
  { label: 'Proceso Jurídico', value: 30, sla: 15 },
  { label: 'Finalizado', value: 2, sla: 1 },
  { label: 'Pagado', value: 1, sla: 1 },
];

export const SLATrackingSection: React.FC<SLATrackingSectionProps> = ({
  backlog = { abiertos: 18, finalizados: 82, total: 100, byStage: [] },
  tiempoPorEtapa = defaultTiempoPorEtapa,
  hasHistoricalData = false,
  isLoading = false,
}) => {
  const divisor = Math.max(backlog.total, 1);
  const porcentajeAbiertos = Math.round((backlog.abiertos / divisor) * 100);
  const porcentajeFinalizados = 100 - porcentajeAbiertos; // Force consistency

  const timelineStages = React.useMemo(() => {
    return defaultStages.map(s => {
      const stageData = backlog.byStage?.find(bs => bs.stage === s.etapa);
      const count = stageData?.count || 0;
      
      let estado = s.estado;
      if (count > 0) {
        estado = 'en_progreso';
      } else if (backlog.byStage && backlog.byStage.some(bs => bs.stage > s.etapa && bs.count > 0)) {
        estado = 'completado';
      } else if (backlog.byStage && backlog.byStage.length > 0) {
        estado = 'pendiente' as any;
      }

      return {
        ...s,
        estado: estado as any,
        count
      };
    });
  }, [backlog.byStage]);

  if (isLoading) {
    return (
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          SLA POR ETAPAS Y CONTROL DE BACKLOG
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl animate-pulse" />
          <div className="h-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl animate-pulse" />
          <div className="h-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl animate-pulse" />
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        SLA POR ETAPAS Y CONTROL DE BACKLOG
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Backlog Control */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <DonutChart
            percentage={porcentajeAbiertos}
            title="CONTROL DE BACKLOG DE SINIESTROS ACTIVOS"
            target={19}
            size="md"
          />

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Siniestros Abiertos</span>
              <span className="text-orange-500 font-semibold">{porcentajeAbiertos}% ({backlog.abiertos} casos)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Siniestros Finalizados</span>
              <span className="text-green-600 dark:text-green-400 font-semibold">
                {porcentajeFinalizados}% ({backlog.finalizados} casos)
              </span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
            <p className="text-xs text-slate-400 mb-2">RESUMEN:</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-500">Casos Abiertos</span>
                <span className="text-orange-500 dark:text-orange-400">{backlog.abiertos}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-500">Casos Finalizados</span>
                <span className="text-green-600 dark:text-green-400">{backlog.finalizados}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-600 pt-1 mt-1">
                <span className="text-slate-700 dark:text-slate-400 font-semibold">Total Siniestros</span>
                <span className="text-slate-800 dark:text-slate-300 font-semibold">{backlog.total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline SLA */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-4 uppercase tracking-wider">
            LÍNEA DE TIEMPO SLA DE SINIESTROS
          </h3>

          <TimelineSLA stages={timelineStages} />

          {/* Tiempo por Etapa */}
          <div className="mt-6">
            <HorizontalBarChart
              data={tiempoPorEtapa}
              title="TIEMPO PROMEDIO POR ETAPA (DÍAS)"
              unit=""
              height={250}
            />
          </div>

          {!hasHistoricalData && (
            <div className="flex items-center gap-2 mt-4 text-yellow-500">
              <AlertTriangle size={16} />
              <span className="text-sm">Pendiente para medir con datos históricos</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
