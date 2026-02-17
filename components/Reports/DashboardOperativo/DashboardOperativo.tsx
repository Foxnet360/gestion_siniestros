import React, { useState, useMemo } from 'react';
import ReportLayout from '../common/ReportLayout';
import ReportFilters from '../common/ReportFilters';
import ExportButtons from '../common/ExportButtons';
import ProductividadTecnicos from './ProductividadTecnicos';
import CasosEstancados from './CasosEstancados';
import { useClaims } from '../../../context/ClaimsContext';
import { useProductividadTecnico } from '../../../hooks/reports/useProductividadTecnico';
import { useCasosEstancados } from '../../../hooks/reports/useCasosEstancados';
import { useTiemposPorFase } from '../../../hooks/reports/useTiemposPorFase';
import type { ReportFilters as ReportFiltersType } from '../../../types/reports';
import type { ExportOptions } from '../../../types/reports';
import { Bar } from 'react-chartjs-2';
import { CHART_COLORS, barChartOptions } from '../../../utils/chartConfig';

interface DashboardOperativoProps {
  onBack: () => void;
}

const DashboardOperativo: React.FC<DashboardOperativoProps> = ({ onBack }) => {
  const { claims } = useClaims();

  const [filters, setFilters] = useState<ReportFiltersType>({
    dateRange: null,
    datePreset: 'this-month',
    ramo: [],
    aseguradora: [],
    tecnico: [],
    estado: [],
  });

  const [diasEstancado, setDiasEstancado] = useState(30);

  // Get filter options
  const filterOptions = useMemo(() => ({
    ramo: [...new Set(claims.map(c => c.ramo))].filter(Boolean).sort(),
    aseguradora: [...new Set(claims.map(c => c.aseguradora))].filter(Boolean).sort(),
    tecnico: [...new Set(claims.map(c => c.tecnico_asignado))].filter(Boolean).sort(),
  }), [claims]);

  // Calculate metrics
  const productividad = useProductividadTecnico(claims, filters);
  const casosEstancados = useCasosEstancados(claims, filters, diasEstancado);
  const tiemposPorFase = useTiemposPorFase(claims, new Map());

  // Chart data for bottlenecks
  const bottleneckData = {
    labels: tiemposPorFase.map(t => `Fase ${t.faseId}`),
    datasets: [{
      label: 'Días promedio',
      data: tiemposPorFase.map(t => t.tiempoPromedio),
      backgroundColor: tiemposPorFase.map(t =>
        t.tiempoPromedio > 15 ? CHART_COLORS.danger : CHART_COLORS.accent1
      ),
      borderRadius: 4,
    }],
  };

  const handleExportExcel = (options: ExportOptions) => {
    console.log('Export Excel:', options);
  };

  const handleExportPDF = (options: ExportOptions) => {
    console.log('Export PDF:', options);
  };

  return (
    <ReportLayout
      title="Dashboard Operativo"
      description="Productividad del equipo y cuellos de botella"
      onBack={onBack}
      actions={
        <ExportButtons
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
        />
      }
    >
      <div className="space-y-6">
        <ReportFilters
          filters={filters}
          onFiltersChange={setFilters}
          filterOptions={filterOptions}
        />

        {/* Bottleneck Chart */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Tiempos por Fase (Cuellos de Botella)</h3>
          <div className="h-64">
            <Bar data={bottleneckData} options={barChartOptions} />
          </div>
        </div>

        <ProductividadTecnicos data={productividad} />

        <CasosEstancados
          data={casosEstancados}
          diasUmbral={diasEstancado}
          onDiasChange={setDiasEstancado}
        />
      </div>
    </ReportLayout>
  );
};

export default DashboardOperativo;
