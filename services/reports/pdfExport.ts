import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import type { ExportOptions, ExecutiveReportData } from '../../types/reports';

// Colors from the app (Slate/Blue)
const COLORS = {
  primary: [15, 23, 42] as [number, number, number], // slate-900 (Restore Dark Slate)
  secondary: [59, 130, 246] as [number, number, number], // blue-500
  accent: [99, 102, 241] as [number, number, number], // indigo-500
  text: [30, 41, 59] as [number, number, number], // slate-800
  muted: [100, 116, 139] as [number, number, number], // slate-500
  border: [226, 232, 240] as [number, number, number], // slate-200
  background: [248, 250, 252] as [number, number, number], // slate-50
  lightBlue: [239, 246, 255] as [number, number, number], // blue-50
  white: [255, 255, 255] as [number, number, number],
  positive: [34, 197, 94] as [number, number, number], // green-500
  negative: [239, 68, 68] as [number, number, number], // red-500
};

export async function exportToPDF(
  elementId: string,
  filename: string,
  options: ExportOptions
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found:', elementId);
    return;
  }

  try {
    // Capture element as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Calculate PDF dimensions
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const ratio = Math.min(pdfWidth / imgWidth, (pdfHeight - 40) / imgHeight);

    const finalImgWidth = imgWidth * ratio;
    const finalImgHeight = imgHeight * ratio;
    const imgX = (pdfWidth - finalImgWidth) / 2;

    // Add title
    const date = new Date().toLocaleDateString('es-ES');
    pdf.setFontSize(16);
    pdf.setTextColor(...COLORS.primary);
    pdf.text(filename.replace(/_/g, ' '), pdfWidth / 2, 15, { align: 'center' });

    pdf.setFontSize(10);
    pdf.setTextColor(...COLORS.muted);
    pdf.text(`Reporte generado el ${date}`, pdfWidth / 2, 22, { align: 'center' });

    // Add image
    pdf.addImage(imgData, 'PNG', imgX, 30, finalImgWidth, finalImgHeight);

    // Add footer
    const pageCount = pdf.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(...COLORS.muted);
      pdf.text(`Página ${i} de ${pageCount} - S.G.S`, pdfWidth / 2, pdfHeight - 10, {
        align: 'center',
      });
    }

    // Save
    const fullFilename = `${filename}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fullFilename);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
}

export async function exportExecutivePDF(
  data: ExecutiveReportData,
  options: ExportOptions
): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // 1. Cover Page
  await drawCoverPage(pdf, data, pageWidth, pageHeight);

  // 2. Highlights Page
  pdf.addPage();
  pdf.setPage(2);
  let currentY = 25;

  pdf.setFontSize(22);
  pdf.setTextColor(...COLORS.primary);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Resumen Ejecutivo', 20, currentY);
  currentY += 15;

  // Draw Highlight Cards (Grid 2xN)
  const cardWidth = (pageWidth - 50) / 2;
  const cardHeight = 35;

  for (let i = 0; i < data.highlights.length; i++) {
    const h = data.highlights[i];
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 20 + col * (cardWidth + 10);
    const y = currentY + row * (cardHeight + 10);

    // Card background
    pdf.setFillColor(...COLORS.background);
    pdf.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F');

    // Label
    pdf.setFontSize(9);
    pdf.setTextColor(...COLORS.muted);
    pdf.setFont('helvetica', 'bold');
    pdf.text(h.label.toUpperCase(), x + 6, y + 10);

    // Value
    pdf.setFontSize(16);
    const valColor =
      h.type === 'positive'
        ? COLORS.positive
        : h.type === 'negative'
          ? COLORS.negative
          : COLORS.primary;
    pdf.setTextColor(...valColor);
    pdf.text(h.value, x + 6, y + 20);

    if (h.subValue) {
      pdf.setFontSize(8);
      pdf.setTextColor(...COLORS.muted);
      pdf.setFont('helvetica', 'normal');
      pdf.text(h.subValue, x + 6, y + 28);
    }
  }

  currentY += Math.ceil(data.highlights.length / 2) * (cardHeight + 10) + 15;

  // 3. Sections (Charts + Insights + Tables)
  for (const section of data.sections) {
    // New page if needed
    if (currentY > 230) {
      pdf.addPage();
      currentY = 25;
    }

    // Section Title
    pdf.setFontSize(18);
    pdf.setTextColor(...COLORS.primary);
    pdf.setFont('helvetica', 'bold');
    pdf.text(section.title, 20, currentY);
    currentY += 10;

    if (section.description) {
      pdf.setFontSize(10);
      pdf.setTextColor(...COLORS.text);
      pdf.setFont('helvetica', 'normal');
      const descLines = pdf.splitTextToSize(section.description, pageWidth - 40);
      pdf.text(descLines, 20, currentY);
      currentY += descLines.length * 5 + 8;
    }

    // Chart if exists
    if (section.chartId && options.includeCharts) {
      const element = document.getElementById(section.chartId);
      if (element) {
        try {
          const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - 40;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          // Check for overflow before drawing chart
          if (currentY + imgHeight > 270) {
            pdf.addPage();
            currentY = 25;
          }

          pdf.addImage(imgData, 'PNG', 20, currentY, imgWidth, imgHeight);
          currentY += imgHeight + 12;
        } catch (err) {
          console.error(`Error capturing chart ${section.chartId}:`, err);
        }
      }
    }

    // Insights
    if (section.insights && section.insights.length > 0) {
      // Force white fill first and then light blue to avoid inheritance issues
      pdf.setFillColor(255, 255, 255);
      pdf.setFillColor(239, 246, 255); // Explicit Light Blue
      pdf.setDrawColor(37, 99, 235); // Blue-600 for border

      // Calculate insights height
      const insightTexts = section.insights.map(i => `• ${i}`);
      const insightLines = insightTexts.map(t => pdf.splitTextToSize(t, pageWidth - 55));
      const totalInsightHeight =
        insightLines.reduce((acc, lines) => acc + lines.length * 5 + 2, 0) + 12;

      if (currentY + totalInsightHeight > 270) {
        pdf.addPage();
        currentY = 25;
      }

      // Explicitly set fill again before drawing rect to be 100% sure
      pdf.setFillColor(239, 246, 255);
      pdf.roundedRect(20, currentY, pageWidth - 40, totalInsightHeight, 2, 2, 'FD');

      let insightY = currentY + 8;
      pdf.setFontSize(10);
      pdf.setTextColor(37, 99, 235); // Blue-600
      pdf.setFont('helvetica', 'bold');
      pdf.text('Análisis y Conclusiones:', 25, insightY);
      insightY += 6;

      pdf.setTextColor(...COLORS.text);
      pdf.setFont('helvetica', 'normal');
      insightLines.forEach(lines => {
        pdf.text(lines, 25, insightY);
        insightY += lines.length * 5 + 2;
      });

      currentY += totalInsightHeight + 10;
    }

    // Table if exists
    if (section.table && options.includeTables) {
      if (currentY > 240) {
        pdf.addPage();
        currentY = 25;
      }

      autoTable(pdf, {
        startY: currentY,
        head: [section.table.headers],
        body: section.table.rows,
        theme: 'striped',
        headStyles: {
          fillColor: COLORS.secondary,
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        margin: { left: 20, right: 20 },
        columnStyles: section.table.widths
          ? section.table.widths.reduce((acc: any, w, idx) => {
              acc[idx] = { cellWidth: w };
              return acc;
            }, {})
          : undefined,
      });

      currentY = (pdf as any).lastAutoTable.finalY + 15;
    }
  }

  // Add Page Numbers and Footer to all pages except cover
  const totalPages = (pdf as any).internal.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    pdf.setPage(i);

    // Page border (subtle)
    pdf.setDrawColor(...COLORS.border);
    pdf.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15);

    pdf.setFontSize(8);
    pdf.setTextColor(...COLORS.muted);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${data.reportType} - Confidencial`, 20, pageHeight - 10);
    pdf.text(`Página ${i} de ${totalPages}`, pageWidth - 40, pageHeight - 10);
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const fullFilename = `Reporte_${data.reportType}_${dateStr}.pdf`;
  pdf.save(fullFilename);
}

async function drawCoverPage(pdf: jsPDF, data: ExecutiveReportData, width: number, height: number) {
  // 1. Background elements (Restore Dark Slate)
  pdf.setFillColor(...COLORS.primary);
  pdf.rect(0, 0, width, height * 0.45, 'F');

  // 2. Corner decorations
  pdf.setFillColor(...COLORS.secondary);
  pdf.triangle(0, 0, 60, 0, 0, 60, 'F');

  // 3. Logo (if provided)
  if (data.branding?.logoUrl) {
    try {
      // Add logo to top right
      const logoSize = 25;
      pdf.addImage(data.branding.logoUrl, 'PNG', width - logoSize - 20, 15, logoSize, logoSize);
    } catch (err) {
      console.warn('Could not load logo:', err);
    }
  }

  // 4. Main Title
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INFORME EJECUTIVO', width / 2, height * 0.15, { align: 'center' });

  pdf.setFontSize(42);
  const brandName = data.branding?.companyName || 'S.G.S';
  pdf.text(brandName, width / 2, height * 0.28, { align: 'center' });

  // Placeholder for additional branding

  // 4. Report Content Info
  pdf.setTextColor(...COLORS.primary);
  pdf.setFontSize(32);
  pdf.setFont('helvetica', 'bold');
  const titleLines = pdf.splitTextToSize(data.title.toUpperCase(), width - 60);
  pdf.text(titleLines, width / 2, height * 0.55, { align: 'center' });

  if (data.subtitle) {
    pdf.setFontSize(16);
    pdf.setTextColor(...COLORS.muted);
    pdf.setFont('helvetica', 'normal');
    pdf.text(data.subtitle, width / 2, height * 0.55 + titleLines.length * 12 + 5, {
      align: 'center',
    });
  }

  // 5. Details Section
  let detailsY = height * 0.75;
  pdf.setDrawColor(...COLORS.border);
  pdf.line(50, detailsY, width - 50, detailsY);
  detailsY += 15;

  pdf.setFontSize(11);
  pdf.setTextColor(...COLORS.muted);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PERIODO DE ANÁLISIS', width / 2, detailsY, { align: 'center' });
  detailsY += 8;

  pdf.setTextColor(...COLORS.text);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.period, width / 2, detailsY, { align: 'center' });

  detailsY += 15;
  pdf.setFontSize(11);
  pdf.setTextColor(...COLORS.muted);
  pdf.setFont('helvetica', 'bold');
  pdf.text('FECHA DE EMISIÓN', width / 2, detailsY, { align: 'center' });
  detailsY += 8;

  pdf.setTextColor(...COLORS.text);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text(
    new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
    width / 2,
    detailsY,
    { align: 'center' }
  );

  // 6. Bottom Banner
  pdf.setFillColor(...COLORS.background);
  pdf.rect(0, height - 25, width, 25, 'F');
  pdf.setFontSize(9);
  pdf.setTextColor(...COLORS.muted);
  pdf.text('Sistema de Gestión de Siniestros - Confidencial', width / 2, height - 10, {
    align: 'center',
  });
}
