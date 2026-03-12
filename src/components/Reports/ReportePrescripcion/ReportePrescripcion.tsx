import React, { useState, useMemo } from 'react';
import ReportLayout from '../common/ReportLayout';
import ReportFilters from '../common/ReportFilters';
import ExportButtons from '../common/ExportButtons';
import TablaPrescripcion from './TablaPrescripcion';
import type { Claim } from '../../../types';
import { useClaims } from '../../../context/ClaimsContext';
import { usePrescripcionRiesgo } from '../../../hooks/reports/usePrescripcionRiesgo';
import { exportToExcel } from '../../../services/reports/excelExport';
import { exportToPDF, exportExecutivePDF } from '../../../services/reports/pdfExport';

// Helper para parsear fechas correctamente evitando problemas de zona horaria
const parseDate = (dateStr: string): Date => {
  // Si la fecha viene en formato YYYY-MM-DD (sin hora), interpretarla como fecha local
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  // Si la fecha viene con timezone UTC (ej: "2023-09-13 00:00:00+00" o "2023-09-13T00:00:00Z")
  // extraer solo la parte de la fecha y tratarla como fecha local
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?([+-]\d{2}:?\d{2}|Z)$/.test(dateStr)) {
    const datePart = dateStr.substring(0, 10);
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateStr);
};
import type {
  ReportFilters as ReportFiltersType,
  RiesgoPrescripcion,
  ExportOptions,
  ExecutiveReportData,
} from '../../../types/reports';

interface ReportePrescripcionProps {
  onBack: () => void;
  onSelectClaim?: (claim: Claim) => void;
}

const ReportePrescripcion: React.FC<ReportePrescripcionProps> = ({ onBack, onSelectClaim }) => {
  const { claims } = useClaims();

  const [filters, setFilters] = useState<ReportFiltersType>({
    dateRange: null,
    datePreset: 'this-month',
    ramo: [],
    aseguradora: [],
    tecnico: [],
    estado: [],
  });

  const [riesgoFilter, setRiesgoFilter] = useState<RiesgoPrescripcion | 'todos'>('todos');

  // Get filter options
  const filterOptions = useMemo(
    () => ({
      ramo: [...new Set(claims.map(c => c.ramo))].filter(Boolean).sort(),
      aseguradora: [...new Set(claims.map(c => c.aseguradora))].filter(Boolean).sort(),
      tecnico: [...new Set(claims.map(c => c.tecnico_asignado))].filter(Boolean).sort(),
    }),
    [claims]
  );

  // Calculate prescription risks
  const riesgosData = usePrescripcionRiesgo(claims);

  // Filter by risk level and other filters
  const filteredData = useMemo(() => {
    return riesgosData.filter(item => {
      // Risk filter
      if (riesgoFilter !== 'todos' && item.nivelRiesgo !== riesgoFilter) return false;

      // Other filters
      if (filters.ramo.length > 0 && !filters.ramo.includes(item.claim.ramo)) return false;
      if (filters.aseguradora.length > 0 && !filters.aseguradora.includes(item.claim.aseguradora))
        return false;
      if (filters.tecnico.length > 0 && !filters.tecnico.includes(item.claim.tecnico_asignado))
        return false;

      return true;
    });
  }, [riesgosData, riesgoFilter, filters]);

  // Statistics
  const stats = useMemo(() => {
    return {
      alto: riesgosData.filter(r => r.nivelRiesgo === 'alto').length,
      medio: riesgosData.filter(r => r.nivelRiesgo === 'medio').length,
      bajo: riesgosData.filter(r => r.nivelRiesgo === 'bajo').length,
    };
  }, [riesgosData]);

  const handleExportExcel = (options: ExportOptions) => {
    const exportData = [
      {
        sheetName: 'Reporte de Prescripción',
        headers: [
          'Riesgo',
          'Días Restantes',
          'Número Siniestro',
          'Asegurado',
          'Aseguradora',
          'Ramo',
          'Técnico',
          'Fecha Aviso',
          'Fecha Prescripción',
          'Días Sin Movimiento',
        ],
        data: filteredData.map(item => [
          item.nivelRiesgo.toUpperCase(),
          item.diasRestantes,
          item.claim.numero_siniestro,
          item.claim.asegurado,
          item.claim.aseguradora,
          item.claim.ramo,
          item.claim.tecnico_asignado || 'Sin Asignar',
          item.claim.fecha_aviso ? parseDate(item.claim.fecha_aviso) : '',
          item.claim.prescripcion_ordinaria ? parseDate(item.claim.prescripcion_ordinaria) : '',
          item.diasSinMovimiento,
        ]),
        summary: {
          title: 'Resumen de Riesgos de Prescripción',
          kpis: [
            { label: 'Casos Alto Riesgo', value: stats.alto },
            { label: 'Casos Riesgo Medio', value: stats.medio },
            { label: 'Casos Bajo Riesgo', value: stats.bajo },
            { label: 'Total Casos', value: riesgosData.length },
          ],
        },
      },
    ];

    exportToExcel(exportData, 'Reporte_Prescripcion', options);
  };

  const handleExportPDF = async (options: ExportOptions) => {
    const reportData: ExecutiveReportData = {
      title: 'Reporte Crítico de Prescripción',
      subtitle: 'Análisis de Siniestros Próximos a Vencer',
      reportType: 'REPORTE_PRESCRIPCION',
      period: 'Situación Actual',
      highlights: [
        { label: 'Alto Riesgo', value: stats.alto.toString(), type: 'negative' },
        { label: 'Riesgo Medio', value: stats.medio.toString(), type: 'neutral' },
        { label: 'Bajo Riesgo', value: stats.bajo.toString(), type: 'positive' },
        { label: 'Total Analizados', value: riesgosData.length.toString(), type: 'neutral' },
      ],
      sections: [
        {
          title: 'Detalle de Casos Críticos',
          description: `Se han identificado ${stats.alto} casos en nivel de alerta roja (menos de 30 días para prescribir).`,
          insights: [
            stats.alto > 0
              ? `Urgente: Gestionar los ${stats.alto} casos de alto riesgo para evitar pérdidas financieras.`
              : 'No se detectan casos en riesgo alto de prescripción.',
            `La mayoría de los casos se encuentran en nivel de riesgo ${stats.alto > stats.medio ? 'alto' : stats.medio > stats.bajo ? 'medio' : 'bajo'}.`,
            'Se recomienda priorizar la gestión de documentos pendientes en casos con riesgo medio.',
          ],
          table: {
            headers: ['Siniestro', 'Días', 'Riesgo', 'Técnico', 'Aseguradora'],
            rows: filteredData
              .slice(0, 15)
              .map(item => [
                item.claim.numero_siniestro,
                item.diasRestantes,
                item.nivelRiesgo.toUpperCase(),
                item.claim.tecnico_asignado || 'N/A',
                item.claim.aseguradora,
              ]),
            widths: [40, 20, 25, 40, 45],
          },
        },
      ],
    };

    await exportExecutivePDF(reportData, options);
  };

  return (
    <ReportLayout
      title="Reporte Crítico de Prescripción"
      description="Casos próximos a prescribir con alertas de riesgo"
      onBack={onBack}
      actions={<ExportButtons onExportExcel={handleExportExcel} onExportPDF={handleExportPDF} />}
    >
      <div id="reporte-prescripcion-content" className="space-y-6">
        {/* Risk Level Stats */}
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setRiesgoFilter(riesgoFilter === 'alto' ? 'todos' : 'alto')}
            className={`p-4 rounded-xl border-2 transition-all shadow-sm ${
              riesgoFilter === 'alto'
                ? 'bg-rose-50 dark:bg-rose-500/20 border-rose-500'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500/50 hover:bg-rose-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <div className="text-3xl mb-1">🔴</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.alto}</div>
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Alto Riesgo
            </div>
          </button>

          <button
            onClick={() => setRiesgoFilter(riesgoFilter === 'medio' ? 'todos' : 'medio')}
            className={`p-4 rounded-xl border-2 transition-all shadow-sm ${
              riesgoFilter === 'medio'
                ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-500'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500/50 hover:bg-amber-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <div className="text-3xl mb-1">🟡</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.medio}</div>
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Riesgo Medio
            </div>
          </button>

          <button
            onClick={() => setRiesgoFilter(riesgoFilter === 'bajo' ? 'todos' : 'bajo')}
            className={`p-4 rounded-xl border-2 transition-all shadow-sm ${
              riesgoFilter === 'bajo'
                ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <div className="text-3xl mb-1">🟢</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.bajo}</div>
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Bajo Riesgo
            </div>
          </button>
        </div>

        <ReportFilters
          filters={filters}
          onFiltersChange={setFilters}
          filterOptions={filterOptions}
          showDateRange={false}
        />

        <TablaPrescripcion data={filteredData} onSelectClaim={onSelectClaim} />
      </div>
    </ReportLayout>
  );
};

export default ReportePrescripcion;
