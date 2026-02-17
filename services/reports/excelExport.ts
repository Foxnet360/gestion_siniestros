import * as XLSX from 'xlsx';
import type { ExportOptions } from '../../types/reports';

interface ExcelExportData {
  sheetName: string;
  headers: string[];
  data: (string | number | Date)[][];
}

export function exportToExcel(
  exports: ExcelExportData[],
  filename: string,
  options: ExportOptions
): void {
  const wb = XLSX.utils.book_new();

  exports.forEach(({ sheetName, headers, data }) => {
    // Create worksheet
    const wsData = [headers, ...data];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    const colWidths = headers.map((_, idx) => ({
      wch: Math.max(
        headers[idx]?.length || 10,
        ...data.map(row => String(row[idx] || '').length)
      ) + 2
    }));
    ws['!cols'] = colWidths;

    // Style header row
    const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellRef]) continue;
      
      ws[cellRef].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '3B82F6' }, patternType: 'solid' },
        alignment: { horizontal: 'center', vertical: 'center' },
      };
    }

    // Add filters to header row
    ws['!autofilter'] = { ref: ws['!ref'] || 'A1' };

    // Freeze first row
    ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2' };

    // Append worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  // Generate filename with date
  const date = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}_${date}.xlsx`;

  // Download
  XLSX.writeFile(wb, fullFilename);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}
