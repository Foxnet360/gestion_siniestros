import * as XLSX from 'xlsx';
import type { ExportOptions, ExcelExportData } from '../../types/reports';

export function exportToExcel(
  exports: ExcelExportData[],
  filename: string,
  options: ExportOptions
): void {
  const wb = XLSX.utils.book_new();

  // 1. ADD SUMMARY SHEET IF PROVIDED
  // We'll use the first export's summary if available or a global one
  const firstExport = exports[0];
  if (firstExport && firstExport.summary) {
    const summaryData = [
      [firstExport.summary.title],
      [],
      ['INDICADOR', 'VALOR'],
      ...firstExport.summary.kpis.map(kpi => [kpi.label, kpi.value]),
      [],
      ['Generado el', new Date().toLocaleDateString('es-ES')],
      ['Modulo', 'S.G.S']
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

    // Summary formatting (basic width)
    wsSummary['!cols'] = [{ wch: 30 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Ejecutivo');
  }

  // 2. ADD DATA SHEETS
  exports.forEach(({ sheetName, headers, data }) => {
    // Create worksheet
    const wsData = [headers, ...data];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths based on longest content
    const colWidths = headers.map((header, idx) => {
      const maxLen = Math.max(
        header.length,
        ...data.map(row => {
          const val = row[idx];
          if (val instanceof Date) return 12;
          return String(val || '').length;
        })
      );
      return { wch: Math.min(maxLen + 4, 50) };
    });
    ws['!cols'] = colWidths;

    // Apply number formats (z property)
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
        if (!cell || cell.t !== 'n') continue;

        // Determine format based on header or value
        const header = String(headers[C]).toLowerCase();
        if (header.includes('valor') || header.includes('monto') || header.includes('indemnizado') || header.includes('reclamado')) {
          cell.z = '"$"#,##0'; // Currency format COP (no decimals)
        } else if (header.includes('porcentaje') || header.includes('%') || header.includes('tasa')) {
          cell.z = '0.0%'; // Percentage format
        } else if (header.includes('días') || header.includes('cantidad') || header.includes('total')) {
          cell.z = '#,##0'; // Number with thousands separator
        }
      }
    }

    // Add filters to header row
    ws['!autofilter'] = { ref: ws['!ref'] || 'A1' };

    // Freeze first row
    ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2' };

    // Append worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31)); // Excel limit
  });

  // Generate filename
  const dateStr = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}_${dateStr}.xlsx`;

  // Download
  XLSX.writeFile(wb, fullFilename);
}

export function formatCurrency(value: number, options: ExportOptions): string {
  const { thousandsSeparator, decimalSeparator, decimalPlaces } = options.numberFormat;

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value)
    .replace(',', 'TEMP_SEP')
    .replace('.', thousandsSeparator)
    .replace('TEMP_SEP', decimalSeparator);
}

export function formatPercentage(value: number, options: ExportOptions): string {
  const { decimalPlaces } = options.numberFormat;
  return `${value.toFixed(decimalPlaces)}%`;
}
