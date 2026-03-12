import React, { useState, useMemo } from 'react';
import ReportLayout from '../common/ReportLayout';
import ReportFilters from '../common/ReportFilters';
import ExportButtons from '../common/ExportButtons';
import KpiFinancieros from './KpiFinancieros';
import KpiOperativos from './KpiOperativos';
import TrendCharts from './TrendCharts';
import { useClaims } from '../../../context/ClaimsContext';
import { useKpiFinancieros } from '../../../hooks/reports/useKpiFinancieros';
import { useKpiOperativos } from '../../../hooks/reports/useKpiOperativos';
import { exportToExcel } from '../../../services/reports/excelExport';
import { exportToPDF, exportExecutivePDF } from '../../../services/reports/pdfExport';
import type { ReportFilters as ReportFiltersType, ExecutiveReportData, ExportOptions } from '../../../types/reports';

interface DashboardGerencialProps {
  onBack: () => void;
}

const DashboardGerencial: React.FC<DashboardGerencialProps> = ({ onBack }) => {
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
  const filterOptions = useMemo(() => ({
    ramo: [...new Set(claims.map(c => c.ramo))].filter(Boolean).sort(),
    aseguradora: [...new Set(claims.map(c => c.aseguradora))].filter(Boolean).sort(),
    tecnico: [...new Set(claims.map(c => c.tecnico_asignado))].filter(Boolean).sort(),
  }), [claims]);

  // Calculate KPIs
  const kpiFinancieros = useKpiFinancieros(claims, filters);
  const kpiOperativos = useKpiOperativos(claims, filters);

  // Handlers
  const handleExportExcel = (options: ExportOptions) => {
    const period = filters.dateRange
      ? `${filters.dateRange.start.toLocaleDateString()} - ${filters.dateRange.end.toLocaleDateString()}`
      : filters.datePreset;

    const exportData = [
      {
        sheetName: 'KPIs Financieros',
        headers: ['Indicador', 'Valor'],
        data: [
          ['Total Reclamado', kpiFinancieros.totalReclamado],
          ['Total Indemnizado', kpiFinancieros.totalIndemnizado],
          ['% Recuperación', kpiFinancieros.porcentajeRecuperacion / 100],
          ['Valor Promedio', kpiFinancieros.valorPromedioSiniestro],
          ['Monto en Riesgo', kpiFinancieros.montoRiesgoPrescripcion],
        ],
        summary: {
          title: `Resumen Gerencial - ${period}`,
          kpis: [
            { label: 'Total Reclamado', value: kpiFinancieros.totalReclamado },
            { label: 'Tasa Recuperación', value: kpiFinancieros.porcentajeRecuperacion / 100 },
            { label: 'Siniestros Activos', value: kpiOperativos.totalSiniestrosActivos },
            { label: 'Tiempo Promedio', value: kpiOperativos.tiempoPromedioTotal }
          ]
        }
      },
      {
        sheetName: 'KPIs Operativos',
        headers: ['Indicador', 'Valor'],
        data: [
          ['Siniestros Activos', kpiOperativos.totalSiniestrosActivos],
          ['Siniestros Cerrados', kpiOperativos.totalSiniestrosCerrados],
          ['% Cerrados en Plazo', kpiOperativos.porcentajeCerradosEnPlazo / 100],
          ['Tiempo Promedio (Días)', kpiOperativos.tiempoPromedioTotal],
          ['% con Objeción', kpiOperativos.porcentajeConObjecion / 100],
        ],
      },
    ];

    exportToExcel(exportData, 'Dashboard_Gerencial', options);
  };

  const handleExportPDF = async (options: ExportOptions) => {
    const period = filters.dateRange
      ? `${filters.dateRange.start.toLocaleDateString()} a ${filters.dateRange.end.toLocaleDateString()}`
      : (filters.datePreset === 'this-month' ? 'Mes Actual' : filters.datePreset);

    const formatCurrency = (val: number) =>
      new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

    const reportData: ExecutiveReportData = {
      title: 'Dashboard Gerencial de Siniestros',
      subtitle: 'Informe de Desempeño Financiero y Operativo',
      reportType: 'DASHBOARD_GERENCIAL',
      period,
      highlights: [
        {
          label: 'Total Reclamado',
          value: formatCurrency(kpiFinancieros.totalReclamado),
          type: 'neutral'
        },
        {
          label: 'Indemnizado',
          value: formatCurrency(kpiFinancieros.totalIndemnizado),
          subValue: `${kpiFinancieros.porcentajeRecuperacion.toFixed(1)}% de recuperación`,
          type: kpiFinancieros.porcentajeRecuperacion > 75 ? 'positive' : 'neutral'
        },
        {
          label: 'Casos Activos',
          value: kpiOperativos.totalSiniestrosActivos.toString(),
          type: 'neutral'
        },
        {
          label: 'Tiempo Promedio',
          value: `${kpiOperativos.tiempoPromedioTotal.toFixed(0)} días`,
          subValue: kpiOperativos.tiempoPromedioTotal < 30 ? 'Dentro de meta' : 'Fuera de meta',
          type: kpiOperativos.tiempoPromedioTotal < 30 ? 'positive' : 'negative'
        },
      ],
      sections: [
        {
          title: 'Análisis de Tendencias Financieras',
          description: 'Comparativo histórico de montos reclamados frente a valores efectivamente indemnizados en los últimos 6 meses.',
          chartId: 'chart-reclamado-indemnizado',
          insights: [
            `El volumen total reclamado en el periodo es de ${formatCurrency(kpiFinancieros.totalReclamado)}.`,
            kpiFinancieros.porcentajeRecuperacion > 70
              ? 'Se mantiene una alta eficiencia en la conversión de reclamaciones a pagos.'
              : 'Se recomienda analizar los motivos de objeción para mejorar la tasa de recuperación.',
            `El valor promedio por siniestro se sitúa en ${formatCurrency(kpiFinancieros.valorPromedioSiniestro)}.`
          ],
          table: {
            headers: ['Métrica', 'Valor'],
            rows: [
              ['Total Reclamado', formatCurrency(kpiFinancieros.totalReclamado)],
              ['Total Indemnizado', formatCurrency(kpiFinancieros.totalIndemnizado)],
              ['Tasa de Recuperación', `${kpiFinancieros.porcentajeRecuperacion.toFixed(1)}%`],
              ['Valor Promedio', formatCurrency(kpiFinancieros.valorPromedioSiniestro)]
            ]
          }
        },
        {
          title: 'Eficiencia Operativa',
          description: 'Seguimiento de tiempos de gestión y estado de la cartera activa.',
          chartId: 'chart-evolucion-casos',
          insights: [
            `Actualmente hay ${kpiOperativos.totalSiniestrosActivos} casos en gestión activa.`,
            `El ${kpiOperativos.porcentajeCerradosEnPlazo.toFixed(1)}% de los casos se cierran dentro del tiempo objetivo (45 días).`,
            kpiOperativos.porcentajeConObjecion > 15
              ? `Alerta: El índice de objeción (${kpiOperativos.porcentajeConObjecion.toFixed(1)}%) es superior al umbral recomendado.`
              : 'El índice de objeciones se mantiene dentro de los parámetros normales.'
          ],
          table: {
            headers: ['Indicador Operativo', 'Resultado'],
            rows: [
              ['Siniestros Activos', kpiOperativos.totalSiniestrosActivos],
              ['Siniestros Cerrados', kpiOperativos.totalSiniestrosCerrados],
              ['Tiempo Promedio de Cierre', `${kpiOperativos.tiempoPromedioTotal.toFixed(1)} días`],
              ['Casos con Objeción', `${kpiOperativos.porcentajeConObjecion.toFixed(1)}%`]
            ]
          }
        }
      ]
    };

    await exportExecutivePDF(reportData, options);
  };

  return (
    <ReportLayout
      title="Dashboard Gerencial"
      description="KPIs financieros y operativos para toma de decisiones estratégicas"
      onBack={onBack}
      actions={
        <ExportButtons
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
        />
      }
    >
      <div id="dashboard-gerencial-content" className="space-y-6">
        <ReportFilters
          filters={filters}
          onFiltersChange={setFilters}
          filterOptions={filterOptions}
        />

        <KpiFinancieros data={kpiFinancieros} />

        <KpiOperativos data={kpiOperativos} />

        <TrendCharts claims={claims} filters={filters} />
      </div>
    </ReportLayout>
  );
};

export default DashboardGerencial;
