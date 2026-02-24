import React, { useState, useMemo } from 'react';
import ReportLayout from '../common/ReportLayout';
import ReportFilters from '../common/ReportFilters';
import ExportButtons from '../common/ExportButtons';
import ProductividadTecnicos from './ProductividadTecnicos';
import CasosEstancados from './CasosEstancados';
import TechnicianDetailModal from './TechnicianDetailModal';
import type { Claim } from '../../../types';
import { useClaims } from '../../../context/ClaimsContext';
import { useProductividadTecnico } from '../../../hooks/reports/useProductividadTecnico';
import { useCasosEstancados } from '../../../hooks/reports/useCasosEstancados';
import { useTiemposPorFase } from '../../../hooks/reports/useTiemposPorFase';
import { exportToExcel } from '../../../services/reports/excelExport';
import { exportToPDF, exportExecutivePDF } from '../../../services/reports/pdfExport';
import type { ReportFilters as ReportFiltersType, ExportOptions, ExecutiveReportData } from '../../../types/reports';
import { Bar } from 'react-chartjs-2';
import { CHART_COLORS, barChartOptions } from '../../../utils/chartConfig';

interface DashboardOperativoProps {
  onBack: () => void;
  onSelectClaim?: (claim: Claim) => void;
}

const DashboardOperativo: React.FC<DashboardOperativoProps> = ({ onBack, onSelectClaim }) => {
  const { claims } = useClaims();

  const [filters, setFilters] = useState<ReportFiltersType>({
    dateRange: null,
    datePreset: 'this-month',
    ramo: [],
    aseguradora: [],
    tecnico: [],
    estado: [],
  });

  const [selectedTechnician, setSelectedTechnician] = useState<string | null>(null);

  const [diasEstancado, setDiasEstancado] = useState(30);

  // Get filter options
  const filterOptions = useMemo(() => ({
    ramo: [...new Set(claims.map(c => c.ramo))].filter(Boolean).sort(),
    aseguradora: [...new Set(claims.map(c => c.aseguradora))].filter(Boolean).sort(),
    tecnico: [...new Set(claims.map(c => c.tecnico_asignado))].filter(Boolean).sort(),
  }), [claims]);

  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      // Date Range Filter
      if (filters.dateRange) {
        const date = claim.fecha_aviso ? new Date(claim.fecha_aviso) : null;
        if (!date || date < filters.dateRange.start || date > filters.dateRange.end) return false;
      }

      // Dimension Filters
      if (filters.ramo.length > 0 && !filters.ramo.includes(claim.ramo)) return false;
      if (filters.aseguradora.length > 0 && !filters.aseguradora.includes(claim.aseguradora)) return false;
      if (filters.tecnico.length > 0 && (!claim.tecnico_asignado || !filters.tecnico.includes(claim.tecnico_asignado))) return false;
      if (filters.estado.length > 0 && !filters.estado.includes(claim.estado_interno)) return false;

      return true;
    });
  }, [claims, filters]);

  // Calculate metrics
  const productividad = useProductividadTecnico(filteredClaims, filters);
  const casosEstancados = useCasosEstancados(filteredClaims, filters, diasEstancado);
  const tiemposPorFase = useTiemposPorFase(filteredClaims, new Map());

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

  const technicianClaims = useMemo(() => {
    if (!selectedTechnician) return [];
    return claims.filter(c => c.tecnico_asignado === selectedTechnician);
  }, [claims, selectedTechnician]);

  const handleExportExcel = (options: ExportOptions) => {
    const period = filters.dateRange
      ? `${filters.dateRange.start.toLocaleDateString()} - ${filters.dateRange.end.toLocaleDateString()}`
      : filters.datePreset;

    const exportData = [
      {
        sheetName: 'Productividad',
        headers: ['Técnico', 'Activos', 'Cerrados', 'Tiempo Promedio', '% Recuperación', 'Estancados'],
        data: productividad.map(item => [
          item.tecnico,
          item.casosActivos,
          item.casosCerrados,
          item.tiempoPromedioCierre,
          item.porcentajeRecuperacion / 100,
          item.casosEstancados
        ]),
        summary: {
          title: `Reporte de Productividad - ${period}`,
          kpis: [
            { label: 'Total Técnicos', value: productividad.length },
            { label: 'Casos Activos', value: productividad.reduce((sum, p) => sum + p.casosActivos, 0) },
            { label: 'Casos Estancados', value: casosEstancados.length }
          ]
        }
      },
      {
        sheetName: 'Casos Estancados',
        headers: ['Siniestro', 'Asegurado', 'Días Sin Movimiento', 'Responsable'],
        data: casosEstancados.map(item => [
          item.claim.numero_siniestro,
          item.claim.asegurado,
          item.diasSinMovimiento,
          item.claim.tecnico_asignado || 'Sin Asignar'
        ]),
      }
    ];

    exportToExcel(exportData, 'Dashboard_Operativo', options);
  };

  const handleExportPDF = async (options: ExportOptions) => {
    const reportData: ExecutiveReportData = {
      title: 'Dashboard Operativo y Productividad',
      subtitle: 'Seguimiento de Carga de Trabajo y Cuellos de Botella',
      reportType: 'DASHBOARD_OPERATIVO',
      period: 'Situación Actual',
      highlights: [
        { label: 'Técnicos Activos', value: productividad.length.toString(), type: 'neutral' },
        { label: 'Casos Estancados', value: casosEstancados.length.toString(), type: casosEstancados.length > 5 ? 'negative' : 'positive' },
        { label: 'Tiempo Promedio Fase', value: `${(tiemposPorFase.reduce((sum, t) => sum + t.tiempoPromedio, 0) / tiemposPorFase.length).toFixed(1)} días`, type: 'neutral' },
      ],
      sections: [
        {
          title: 'Análisis de Cuellos de Botella',
          description: 'Identificación de las fases del proceso que presentan mayores tiempos de espera.',
          chartId: 'chart-bottlenecks',
          insights: [
            ...tiemposPorFase.filter(t => t.tiempoPromedio > 15).map(t => `La Fase ${t.faseId} es un cuello de botella crítico (${t.tiempoPromedio.toFixed(1)} días).`),
            `El tiempo promedio total de gestión se estima en ${tiemposPorFase.reduce((sum, t) => sum + t.tiempoPromedio, 0).toFixed(0)} días laborables.`
          ],
          table: {
            headers: ['Fase', 'Descripción', 'Tiempo Promedio', 'Casos'],
            rows: tiemposPorFase.map(t => [`Fase ${t.faseId}`, t.fase, `${t.tiempoPromedio.toFixed(1)} d`, t.casosCount])
          }
        },
        {
          title: 'Productividad por Técnico',
          description: 'Desempeño individual y carga de casos por cada profesional asignado.',
          insights: [
            `El técnico con mayor eficiencia en cierres es ${[...productividad].sort((a, b) => b.casosCerrados - a.casosCerrados)[0]?.tecnico || 'N/A'}.`,
            `Existen ${casosEstancados.length} casos sin movimiento por más de ${diasEstancado} días que requieren intervención.`
          ],
          table: {
            headers: ['Técnico', 'Activos', 'Cerrados', 'Tiempo Cierre', '% Recup.'],
            rows: productividad.map(p => [p.tecnico, p.casosActivos, p.casosCerrados, `${p.tiempoPromedioCierre.toFixed(1)} d`, `${p.porcentajeRecuperacion.toFixed(1)}%`]),
            widths: [45, 20, 20, 30, 25]
          }
        }
      ]
    };

    await exportExecutivePDF(reportData, options);
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
      <div id="dashboard-operativo-content" className="space-y-6">
        <ReportFilters
          filters={filters}
          onFiltersChange={setFilters}
          filterOptions={filterOptions}
        />

        {/* Bottleneck Chart */}
        <div id="chart-bottlenecks" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Tiempos por Fase (Cuellos de Botella)</h3>
          <div className="h-64">
            <Bar data={bottleneckData} options={barChartOptions} />
          </div>
        </div>

        <ProductividadTecnicos
          data={productividad}
          onSelectTechnician={setSelectedTechnician}
        />

        <CasosEstancados
          data={casosEstancados}
          diasUmbral={diasEstancado}
          onDiasChange={setDiasEstancado}
        />
      </div>

      {selectedTechnician && (
        <TechnicianDetailModal
          technician={selectedTechnician}
          claims={technicianClaims}
          onClose={() => setSelectedTechnician(null)}
          onSelectClaim={onSelectClaim}
        />
      )}
    </ReportLayout>
  );
};

export default DashboardOperativo;
