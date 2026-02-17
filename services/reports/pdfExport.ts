import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { ExportOptions } from '../../types/reports';

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
      backgroundColor: '#0f172a', // slate-900
    });

    // Calculate PDF dimensions
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    
    // Add title
    const date = new Date().toLocaleDateString('es-ES');
    pdf.setFontSize(16);
    pdf.text(filename, pdfWidth / 2, 15, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.text(`Generado: ${date}`, pdfWidth / 2, 22, { align: 'center' });
    
    // Add image
    pdf.addImage(imgData, 'PNG', imgX, 30, imgWidth * ratio, imgHeight * ratio);
    
    // Add footer
    const pageCount = pdf.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.text(
        `Página ${i} de ${pageCount}`,
        pdfWidth / 2,
        pdfHeight - 10,
        { align: 'center' }
      );
    }

    // Save
    const fullFilename = `${filename}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fullFilename);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
}

export function generatePDFReport(
  title: string,
  sections: { title: string; content: string }[]
): jsPDF {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  let yPos = 20;
  
  // Title
  pdf.setFontSize(20);
  pdf.setTextColor(59, 130, 246); // blue-500
  pdf.text(title, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 15;
  
  // Date
  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139); // slate-500
  pdf.text(
    `Generado: ${new Date().toLocaleDateString('es-ES')}`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );
  
  yPos += 20;
  
  // Sections
  sections.forEach((section) => {
    // Check if we need a new page
    if (yPos > 250) {
      pdf.addPage();
      yPos = 20;
    }
    
    // Section title
    pdf.setFontSize(14);
    pdf.setTextColor(30, 41, 59); // slate-800
    pdf.text(section.title, 20, yPos);
    
    yPos += 10;
    
    // Section content
    pdf.setFontSize(10);
    pdf.setTextColor(71, 85, 105); // slate-600
    
    const splitContent = pdf.splitTextToSize(section.content, pageWidth - 40);
    pdf.text(splitContent, 20, yPos);
    
    yPos += splitContent.length * 5 + 15;
  });
  
  return pdf;
}
