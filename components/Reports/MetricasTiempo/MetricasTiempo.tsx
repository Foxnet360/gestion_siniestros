import React, { useState, useMemo } from 'react';
import ReportLayout from '../common/ReportLayout';
import ReportFilters from '../common/ReportFilters';
import ExportButtons from '../common/ExportButtons';
import TiemposPorFase from './TiemposPorFase';
import TiemposTendenciaLineChart from './TiemposTendenciaLineChart';
import { useClaims } from '../../../context/ClaimsContext';
import { useTiemposPromedio } from '../../../hooks/reports/useTiemposPromedio';
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
  ExportOptions,
  ExecutiveReportData,
} from '../../../types/reports';

interface MetricasTiempoProps {
  onBack: () => void;
}

const MetricasTiempo: React.FC<MetricasTiempoProps> = ({ onBack }) => {
  const { claims } = useClaims();

  const [filters, setFilters] = useState<ReportFiltersType>({
    dateRange: null,
    datePreset: 'this-month',
    ramo: [],
    aseguradora: [],
    tecnico: [],
    estado: [],
  });

  // Get filter options
  const filterOptions = useMemo(
    () => ({
      ramo: [...new Set(claims.map(c => c.ramo))].filter(Boolean).sort(),
      aseguradora: [...new Set(claims.map(c => c.aseguradora))].filter(Boolean).sort(),
      tecnico: [...new Set(claims.map(c => c.tecnico_asignado))].filter(Boolean).sort(),
    }),
    [claims]
  );

  const filteredClaims = useMemo(() => {
    return claims.filter(claim => {
      // Date Range Filter
      if (filters.dateRange) {
        const date = claim.fecha_aviso ? parseDate(claim.fecha_aviso) : null;
        if (!date || date < filters.dateRange.start || date > filters.dateRange.end) return false;
      }

      // Dimension Filters
      if (filters.ramo.length > 0 && !filters.ramo.includes(claim.ramo)) return false;
      if (filters.aseguradora.length > 0 && !filters.aseguradora.includes(claim.aseguradora))
        return false;
      if (
        filters.tecnico.length > 0 &&
        (!claim.tecnico_asignado || !filters.tecnico.includes(claim.tecnico_asignado))
      )
        return false;
      if (filters.estado.length > 0 && !filters.estado.includes(claim.estado_interno)) return false;

      return true;
    });
  }, [claims, filters]);

  // Calculate time metrics
  const tiempos = useTiemposPromedio(claims, filters);

  const handleExportExcel = (options: ExportOptions) => {
    const period = filters.dateRange
      ? `${filters.dateRange.start.toLocaleDateString()} - ${filters.dateRange.end.toLocaleDateString()}`
      : filters.datePreset;

    const exportData = [
      {
        sheetName: 'Por Aseguradora',
        headers: ['Aseguradora', 'Tiempo Promedio (Días)', 'Casos'],
        data: tiempos.porAseguradora.map(item => [item.aseguradora, item.tiempo, item.count]),
        summary: {
          title: `Métricas de Tiempo por Aseguradora - ${period}`,
          kpis: [
            { label: 'Tiempo Promedio General', value: `${Math.round(tiempos.general)} días` },
            {
              label: 'Mejor Aseguradora',
              value: tiempos.porAseguradora[tiempos.porAseguradora.length - 1]?.aseguradora || '-',
            },
            { label: 'Peor Aseguradora', value: tiempos.porAseguradora[0]?.aseguradora || '-' },
          ],
        },
      },
      {
        sheetName: 'Por Ramo',
        headers: ['Ramo', 'Tiempo Promedio (Días)', 'Casos'],
        data: tiempos.porRamo.map(item => [item.ramo, item.tiempo, item.count]),
      },
    ];

    exportToExcel(exportData, 'Metricas_Tiempo', options);
  };

  const handleExportPDF = async (options: ExportOptions) => {
    const reportData: ExecutiveReportData = {
      title: 'Informe Analítico de Tiempos de Gestión',
      subtitle: 'Eficiencia por Fases y Dimensiones de Negocio',
      reportType: 'METRICAS_TIEMPO',
      period: filters.datePreset,
      highlights: [
        {
          label: 'Tiempo Promedio',
          value: `${Math.round(tiempos.general)} días`,
          type: tiempos.general < 30 ? 'positive' : 'neutral',
        },
        {
          label: 'Mejor Ramo',
          value: tiempos.porRamo[tiempos.porRamo.length - 1]?.ramo || '-',
          type: 'neutral',
        },
        { label: 'Casos Analizados', value: filteredClaims.length.toString(), type: 'neutral' },
      ],
      sections: [
        {
          title: 'Ciclo de Vida por Fase',
          description:
            'Desglose del tiempo de permanencia de los siniestros en cada etapa del proceso.',
          chartId: 'chart-tiempos-fase',
          insights: [
            `El proceso completo toma en promedio ${Math.round(tiempos.general)} días calendario.`,
            'Se observa una oportunidad de mejora en las fases que superan los 15 días de gestión.',
            'La optimización de la fase inicial (Aviso) impacta directamente en la satisfacción del asegurado.',
          ],
        },
        {
          title: 'Tendencia Histórica',
          description: 'Evolución del tiempo promedio de cierre en los últimos 12 meses.',
          chartId: 'chart-tiempos-tendencia',
          insights: [
            tiempos.general < 35
              ? 'La tendencia se mantiene estable y dentro de los parámetros de eficiencia aceptables.'
              : 'Se requiere una revisión de procesos debido a la tendencia incremental en los tiempos de respuesta.',
          ],
        },
        {
          title: 'Desempeño por Aseguradora',
          description: 'Comparativo de tiempos de respuesta por compañía aseguradora.',
          insights: [
            `La aseguradora ${tiempos.porAseguradora[tiempos.porAseguradora.length - 1]?.aseguradora} lidera en rapidez con ${Math.round(tiempos.porAseguradora[tiempos.porAseguradora.length - 1]?.tiempo || 0)} días.`,
            `Se recomienda realizar mesas de trabajo con ${tiempos.porAseguradora[0]?.aseguradora} para agilizar sus procesos internos.`,
          ],
          table: {
            headers: ['Aseguradora', 'Tiempo Promedio', 'Volumen de Casos'],
            rows: tiempos.porAseguradora.map(a => [
              a.aseguradora,
              `${Math.round(a.tiempo)} d`,
              a.count,
            ]),
          },
        },
      ],
    };

    await exportExecutivePDF(reportData, options);
  };

  return (
    <ReportLayout
      title="Métricas de Tiempo"
      description="Análisis de tiempos de gestión por fase y dimensión"
      onBack={onBack}
      actions={<ExportButtons onExportExcel={handleExportExcel} onExportPDF={handleExportPDF} />}
    >
      <div id="metricas-tiempo-content" className="space-y-6">
        <ReportFilters
          filters={filters}
          onFiltersChange={setFilters}
          filterOptions={filterOptions}
        />

        {/* General Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">
              Tiempo Promedio General
            </p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {Math.round(tiempos.general)} días
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">
              Mejor Aseguradora
            </p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {tiempos.porAseguradora.length > 0
                ? tiempos.porAseguradora[tiempos.porAseguradora.length - 1]?.aseguradora
                : '-'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {tiempos.porAseguradora.length > 0
                ? `${Math.round(tiempos.porAseguradora[tiempos.porAseguradora.length - 1]?.tiempo)} días`
                : ''}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">
              Peor Aseguradora
            </p>
            <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
              {tiempos.porAseguradora.length > 0 ? tiempos.porAseguradora[0]?.aseguradora : '-'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {tiempos.porAseguradora.length > 0
                ? `${Math.round(tiempos.porAseguradora[0]?.tiempo)} días`
                : ''}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TiemposPorFase claims={filteredClaims} />
          <TiemposTendenciaLineChart claims={filteredClaims} />
        </div>

        {/* Tables by dimension */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Por Aseguradora</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Aseguradora
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Tiempo Prom.
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Casos
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {tiempos.porAseguradora.map(item => (
                    <tr
                      key={item.aseguradora}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200 font-medium text-sm">
                        {item.aseguradora}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`font-medium ${
                            item.tiempo > 45
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {Math.round(item.tiempo)} días
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                        {item.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Por Ramo</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Ramo
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Tiempo Prom.
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Casos
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {tiempos.porRamo.map(item => (
                    <tr
                      key={item.ramo}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200 font-medium text-sm">
                        {item.ramo}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`font-medium ${
                            item.tiempo > 45
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {Math.round(item.tiempo)} días
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                        {item.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </ReportLayout>
  );
};

export default MetricasTiempo;
