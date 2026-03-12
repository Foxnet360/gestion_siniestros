import { EficienciaData, FunnelData, CalidadDatos } from '../hooks/useEficienciaEtapas';

export function exportarMetricasACSV(
  data: EficienciaData,
  funnel: FunnelData | null,
  calidad: CalidadDatos | null,
  filename: string = 'metricas_eficiencia_etapas.csv'
): void {
  const rows: string[] = [];

  // Header
  rows.push(
    'Etapa,Nombre,Cantidad Siniestros,Tiempo Promedio (dias),Tiempo P50 (dias),Tiempo P90 (dias),SLA (dias),% Cumple SLA,Tasa Conversion %'
  );

  // Data rows
  data.metricasPorEtapa
    .filter(m => m.cantidadSiniestros > 0)
    .forEach(etapa => {
      rows.push(
        [
          etapa.etapaNum,
          `"${etapa.etapaNombre}"`,
          etapa.cantidadSiniestros,
          etapa.tiempoPromedio.toFixed(2),
          etapa.tiempoP50,
          etapa.tiempoP90,
          etapa.diasSLA || '',
          etapa.cumpleSLAPorcentaje.toFixed(2),
          etapa.tasaConversion.toFixed(2),
        ].join(',')
      );
    });

  // Empty row
  rows.push('');

  // Resumen section
  rows.push('RESUMEN');
  rows.push('Metrica,Valor');
  rows.push(`Total Siniestros,${data.resumen.totalSiniestros}`);
  rows.push(`Lead Time Promedio (dias),${data.resumen.leadTimeAvg}`);
  rows.push(`Lead Time P50 (dias),${data.resumen.leadTimeP50}`);
  rows.push(`Lead Time P90 (dias),${data.resumen.leadTimeP90}`);
  rows.push(`Lead Time Min (dias),${data.resumen.leadTimeMin}`);
  rows.push(`Lead Time Max (dias),${data.resumen.leadTimeMax}`);

  // Calidad section
  if (calidad) {
    rows.push('');
    rows.push('CALIDAD DE DATOS');
    rows.push('Metrica,Valor');
    rows.push(`Total Analizados,${calidad.totalAnalizados}`);
    rows.push(`Incluidos en KPI,${calidad.incluidosEnKPI}`);
    rows.push(`Excluidos,${calidad.excluidos.total}`);
    rows.push(`Excluidos Sin Etapa 1,${calidad.excluidos.porRazon.sinEtapa1}`);
    rows.push(`Excluidos Sin Etapa 16,${calidad.excluidos.porRazon.sinEtapa16}`);
    rows.push(`Excluidos Datos Insuficientes,${calidad.excluidos.porRazon.datosInsuficientes}`);
  }

  // Funnel section
  if (funnel) {
    rows.push('');
    rows.push('FUNNEL DE CONVERSION');
    rows.push('Etapa,Nombre,Entrada,Salida,Tasa Conversion %');
    funnel.etapas
      .filter(e => e.entrada > 0)
      .forEach(etapa => {
        rows.push(
          [
            etapa.etapaNum,
            `"${etapa.etapaNombre}"`,
            etapa.entrada,
            etapa.salida,
            etapa.tasaConversion.toFixed(2),
          ].join(',')
        );
      });
    rows.push(`Conversion General,${funnel.conversionGeneral.toFixed(2)}%`);
  }

  // Create and download file
  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function exportarExcluidosACSV(
  calidad: CalidadDatos,
  filename: string = 'siniestros_excluidos.csv'
): void {
  const rows: string[] = [];

  // Header
  rows.push('ID Siniestro,Razon Exclusion,Datos Disponibles');

  // Note: This is a placeholder. In a real implementation,
  // you would fetch the actual excluded claims data
  rows.push(
    'Nota,Esta es una exportacion de ejemplo. En produccion se exportarian los datos reales,'
  );

  // Summary
  rows.push('');
  rows.push('RESUMEN DE EXCLUSIONES');
  rows.push(`Total Excluidos,${calidad.excluidos.total}`);
  rows.push(`Sin Etapa 1,${calidad.excluidos.porRazon.sinEtapa1}`);
  rows.push(`Sin Etapa 16,${calidad.excluidos.porRazon.sinEtapa16}`);
  rows.push(`Datos Insuficientes,${calidad.excluidos.porRazon.datosInsuficientes}`);

  // Create and download file
  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
