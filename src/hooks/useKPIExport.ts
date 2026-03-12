import { useCallback } from 'react';
import type { KPIOverview, LeadTimeMetrics, TasasMetrics, BacklogMetrics } from '../types/sla-kpi';

interface ExportData {
  overview: KPIOverview | null;
  leadTime: LeadTimeMetrics | null;
  tasas: TasasMetrics | null;
  backlog: BacklogMetrics | null;
}

/**
 * Hook for exporting KPI data to CSV
 */
export function useKPIExport() {
  const exportToCSV = useCallback((data: ExportData, filename?: string) => {
    if (!data.overview) {
      throw new Error('No data to export');
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const defaultFilename = `kpi-report-${timestamp}.csv`;
    const finalFilename = filename || defaultFilename;

    // Build CSV content
    const rows: string[] = [];

    // Header
    rows.push('KPI Reporte');
    rows.push(`Generado: ${new Date().toLocaleString('es-CO')}`);
    rows.push('');

    // Overview section
    rows.push('INDICADORES PRINCIPALES');
    rows.push('KPI,Valor,Unidad,Meta');
    rows.push(`Ciclo de Resolución (Lead Time),${data.overview.leadTimeAvg},días hábiles,≤ 30`);
    rows.push(`Tasa de Desistimiento,${data.overview.tasaDesistimiento},%,≤ 10%`);
    rows.push(`Tasa de Objetados,${data.overview.tasaObjetados},%,-`);
    rows.push(`Tasa de Prescritos,${data.overview.tasaPrescritos},%,-`);
    rows.push(`% Cerrados en Plazo (SLA),${data.overview.porcentajeCerradosPlazo},%,≤ 19%`);
    rows.push(`Backlog de Siniestros Activos,${data.overview.backlogActivos},casos,-`);
    rows.push('');

    // Lead Time section
    if (data.leadTime) {
      rows.push('LEAD TIME');
      rows.push('Métrica,Valor');
      rows.push(`Promedio,${data.leadTime.average} días`);

      if (data.leadTime.percentiles) {
        rows.push(`Percentil 50,${data.leadTime.percentiles.p50} días`);
        rows.push(`Percentil 75,${data.leadTime.percentiles.p75} días`);
        rows.push(`Percentil 90,${data.leadTime.percentiles.p90} días`);
        rows.push(`Percentil 95,${data.leadTime.percentiles.p95} días`);
      }
      rows.push('');
    }

    // Tasas section
    if (data.tasas) {
      rows.push('TASAS');
      rows.push('Tipo,Valor %');
      rows.push(`Desistimiento,${data.tasas.tasaDesistimiento}%`);
      rows.push(`Objetados,${data.tasas.tasaObjetados}%`);
      rows.push(`Prescritos,${data.tasas.tasaPrescritos}%`);

      if (data.tasas.counts) {
        rows.push('');
        rows.push('CONTEOS ABSOLUTOS');
        rows.push('Tipo,Cantidad');
        rows.push(`Desistimientos,${data.tasas.counts.desistimiento}`);
        rows.push(`Objeciones,${data.tasas.counts.objetados}`);
        rows.push(`Prescripciones,${data.tasas.counts.prescritos}`);
        rows.push(`Total Siniestros,${data.tasas.counts.total}`);
      }
      rows.push('');
    }

    // Backlog section
    if (data.backlog) {
      rows.push('BACKLOG');
      rows.push('Métrica,Valor');
      rows.push(`Total Activos,${data.backlog.total}`);

      if (data.backlog.byAge) {
        rows.push('');
        rows.push('BACKLOG POR ANTIGÜEDAD');
        rows.push('Rango,Cantidad');
        data.backlog.byAge.forEach(item => {
          rows.push(`${item.range},${item.count}`);
        });
      }

      if (data.backlog.byStage) {
        rows.push('');
        rows.push('BACKLOG POR ETAPA');
        rows.push('Etapa,Cantidad');
        data.backlog.byStage.forEach(item => {
          rows.push(`Etapa ${item.stage},${item.count}`);
        });
      }
      rows.push('');
    }

    // Convert to CSV string
    const csvContent = rows.join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', finalFilename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, []);

  return { exportToCSV };
}

export default useKPIExport;
