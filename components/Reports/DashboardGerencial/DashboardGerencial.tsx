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
import { exportToPDF } from '../../../services/reports/pdfExport';
import type { ReportFilters as ReportFiltersType } from '../../../types/reports';
import type { ExportOptions } from '../../../types/reports';

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
    const exportData = [
      {
        sheetName: 'KPIs Financieros',
        headers: ['Indicador', 'Valor'],
        data: [
          ['Total Reclamado', kpiFinancieros.totalReclamado],
          ['Total Indemnizado', kpiFinancieros.totalIndemnizado],
          ['% Recuperación', kpiFinancieros.porcentajeRecuperacion],
          ['Valor Promedio', kpiFinancieros.valorPromedioSiniestro],
          ['Monto en Riesgo', kpiFinancieros.montoRiesgoPrescripcion],
        ],
      },
      {
        sheetName: 'KPIs Operativos',
        headers: ['Indicador', 'Valor'],
        data: [
          ['Siniestros Activos', kpiOperativos.totalSiniestrosActivos],
          ['Siniestros Cerrados', kpiOperativos.totalSiniestrosCerrados],
          ['% Cerrados en Plazo', kpiOperativos.porcentajeCerradosEnPlazo],
          ['Tiempo Promedio', kpiOperativos.tiempoPromedioTotal],
          ['% con Objeción', kpiOperativos.porcentajeConObjecion],
        ],
      },
    ];

    exportToExcel(exportData, 'Dashboard_Gerencial', options);
  };

  const handleExportPDF = async (options: ExportOptions) => {
    await exportToPDF('dashboard-gerencial-content', 'Dashboard_Gerencial', options);
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
