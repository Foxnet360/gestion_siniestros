import React from 'react';
import { Claim } from '../../types';
import { Save, Shield, X, CheckCircle2, Calendar, Download } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

interface ClaimDetailHeaderProps {
  claim: Claim;
  onClose: () => void;
  onSave: () => void;
}

/**
 * Exporta la bitácora y datos del siniestro a CSV
 */
const exportBitacoraToCSV = (claim: Claim) => {
  const headers = [
    'N° Siniestro',
    'N° Siniestro Compañía',
    'Tipo',
    'Asegurado',
    'Documento',
    'Póliza',
    'Aseguradora',
    'Ramo',
    'Fecha Siniestro',
    'Fecha Aviso',
    'Fecha Radicación',
    'Proveedor',
    'Estado',
    'Finalizado',
    'Fecha Finalización',
    'Timeline Fecha',
    'Timeline Autor',
    'Timeline Texto',
  ];

  const rows: string[] = [];

  // Create a row for each timeline event
  if (claim.timeline && claim.timeline.length > 0) {
    claim.timeline.forEach(event => {
      const row = [
        claim.numero_siniestro,
        claim.numero_siniestro_compania || '',
        claim.tipo_siniestro || '',
        claim.asegurado,
        claim.documento_asegurado || '',
        claim.poliza,
        claim.aseguradora,
        claim.ramo,
        claim.fecha_ocurrencia || '',
        claim.fecha_aviso || '',
        claim.fecha_notificacion_aseguradora || '',
        claim.proveedor_asignado || '',
        claim.estado_interno,
        claim.finalizado ? 'Sí' : 'No',
        claim.fecha_finalizacion || '',
        event.date,
        event.author,
        event.text,
      ];
      rows.push(row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));
    });
  } else {
    // Single row with no timeline data
    const row = [
      claim.numero_siniestro,
      claim.numero_siniestro_compania || '',
      claim.tipo_siniestro || '',
      claim.asegurado,
      claim.documento_asegurado || '',
      claim.poliza,
      claim.aseguradora,
      claim.ramo,
      claim.fecha_ocurrencia || '',
      claim.fecha_aviso || '',
      claim.fecha_notificacion_aseguradora || '',
      claim.proveedor_asignado || '',
      claim.estado_interno,
      claim.finalizado ? 'Sí' : 'No',
      claim.fecha_finalizacion || '',
      '',
      '',
      '',
    ];
    rows.push(row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));
  }

  const csvContent = [headers.join(','), ...rows].join('\n');
  // Add BOM for Excel UTF-8 support and proper accent characters
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `bitacora_${claim.numero_siniestro}_${new Date().toISOString().split('T')[0]}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Header del modal de ClaimDetail
 * Muestra información identificadora y acciones principales
 */
export const ClaimDetailHeader: React.FC<ClaimDetailHeaderProps> = ({ claim, onClose, onSave }) => {
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
          onClick={() => exportBitacoraToCSV(claim)}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          title="Exportar bitácora y datos a CSV"
        >
          <Download className="w-4 h-4" />
          <span>Exportar</span>
        </button>
        <button
          onClick={onSave}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Guardar</span>
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
