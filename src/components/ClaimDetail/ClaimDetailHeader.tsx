import React from 'react';
import { Claim } from '../../types';
import { Shield, X, CheckCircle2, Calendar, Download } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import * as XLSX from 'xlsx';

interface ClaimDetailHeaderProps {
  claim: Claim;
  onClose: () => void;
}

/**
 * Exporta la bitácora y datos completos del siniestro a Excel (.xlsx)
 * Incluye todos los campos de SoftSeguros e información interna
 */
const exportBitacoraToExcel = (claim: Claim) => {
  const headers = [
    // Información Principal
    'N° Siniestro',
    'N° Siniestro Compañía',
    'Tipo Siniestro',
    'Estado SoftSeguros',
    'Estado Interno',
    'Usuario Registro',
    'Placa Bien',

    // Asegurado
    'Nombre Asegurado',
    'Documento Asegurado',
    'Email Principal',
    'Celular Principal',

    // Póliza y Aseguradora
    'Póliza',
    'Aseguradora',
    'Ramo',
    'Vendedor',
    'Técnico Asignado',
    'Aliado Origen',

    // Fechas
    'Fecha Siniestro',
    'Fecha Aviso',
    'Fecha Notificación Aseguradora',
    'Fecha Finalización',
    'Finalizado',

    // Valores
    'Monto Reclamo',
    'Valor Deducible',
    'Valor Indemnización',

    // Gestión
    'Último Seguimiento Raw',
    'Estado Gestión SoftSeguros',
    'Próximo Seguimiento',
    'Prioridad',

    // Bitácora Timeline
    'Timeline Fecha',
    'Timeline Autor',
    'Timeline Texto',
  ];

  const formatCurrency = (value: number | undefined | null): number | string => {
    if (value === undefined || value === null || value === 0) return '';
    return value;
  };

  const rows: (string | number)[][] = [];

  // Helper function to create a data row
  const createDataRow = (
    timelineDate: string = '',
    timelineAuthor: string = '',
    timelineText: string = ''
  ): (string | number)[] => {
    return [
      // Información Principal
      claim.numero_siniestro,
      claim.numero_siniestro_compania || '',
      claim.tipo_siniestro || '',
      claim.estado_softseguros || '',
      claim.estado_interno,
      claim.usuario_registro || '',
      claim.placa_bien || '',

      // Asegurado
      claim.asegurado,
      claim.documento_asegurado || '',
      claim.email_principal || '',
      claim.celular_principal || '',

      // Póliza y Aseguradora
      claim.poliza,
      claim.aseguradora,
      claim.ramo,
      claim.vendedor || '',
      claim.tecnico_asignado || '',
      claim.aliado_origen || '',

      // Fechas
      claim.fecha_ocurrencia || '',
      claim.fecha_aviso || '',
      claim.fecha_notificacion_aseguradora || '',
      claim.fecha_finalizacion || '',
      claim.finalizado ? 'Sí' : 'No',

      // Valores
      formatCurrency(claim.monto_reclamo),
      formatCurrency(claim.valor_deducible),
      formatCurrency(claim.valor_indemnizacion),

      // Gestión
      claim.ultimo_seguimiento_raw || '',
      claim.estado_gestion_softseguros || '',
      claim.proximo_seguimiento || '',
      claim.prioridad || '',

      // Timeline
      timelineDate,
      timelineAuthor,
      timelineText,
    ];
  };

  // Create a row for each timeline event
  if (claim.timeline && claim.timeline.length > 0) {
    claim.timeline.forEach(event => {
      rows.push(createDataRow(event.date, event.author, event.text));
    });
  } else {
    // Single row with no timeline data
    rows.push(createDataRow());
  }

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Set column widths for better readability
  const colWidths = headers.map((header, index) => {
    const maxLength = Math.max(header.length, ...rows.map(row => String(row[index] || '').length));
    return { wch: Math.min(Math.max(maxLength, 10), 50) };
  });
  ws['!cols'] = colWidths;

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Bitácora');

  // Generate Excel file
  XLSX.writeFile(
    wb,
    `bitacora_${claim.numero_siniestro}_${new Date().toISOString().split('T')[0]}.xlsx`
  );
};

/**
 * Header del modal de ClaimDetail
 * Muestra información identificadora y acciones principales
 */
export const ClaimDetailHeader: React.FC<ClaimDetailHeaderProps> = ({ claim, onClose }) => {
  return (
    <div className="h-16 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 bg-white dark:bg-slate-800/50">
      <div className="flex items-center space-x-4">
        <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg">
          <Shield className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {claim.asegurado}
            <span className="text-xs font-normal text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800/50">
              {claim.numero_siniestro}
            </span>
            {claim.finalizado ? (
              <span className="flex items-center text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800/50">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Finalizado
                {claim.fecha_finalizacion && (
                  <span className="ml-1 flex items-center text-emerald-600 dark:text-emerald-500">
                    <Calendar className="w-3 h-3 mx-1" />
                    {formatDate(claim.fecha_finalizacion)}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                En Proceso
              </span>
            )}
          </h2>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={() => exportBitacoraToExcel(claim)}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          title="Exportar bitácora y datos a Excel"
        >
          <Download className="w-4 h-4" />
          <span>Exportar</span>
        </button>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
