import React from 'react';
import { Download } from 'lucide-react';
import { useKPIExport } from '../../hooks/useKPIExport';
import type {
  KPIOverview,
  LeadTimeMetrics,
  TasasMetrics,
  BacklogMetrics,
} from '../../types/sla-kpi';

interface ExportButtonProps {
  overview: KPIOverview | null;
  leadTime: LeadTimeMetrics | null;
  tasas: TasasMetrics | null;
  backlog: BacklogMetrics | null;
  loading?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  overview,
  leadTime,
  tasas,
  backlog,
  loading = false,
}) => {
  const { exportToCSV } = useKPIExport();
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    if (!overview || loading) return;

    setIsExporting(true);
    try {
      exportToCSV({ overview, leadTime, tasas, backlog });
    } catch (error) {
      console.error('Export error:', error);
      alert('Error al exportar: ' + (error as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  const isDisabled = loading || isExporting || !overview;

  return (
    <button
      onClick={handleExport}
      disabled={isDisabled}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
        ${
          isDisabled
            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
        }
      `}
    >
      <Download className={`w-5 h-5 ${isExporting ? 'animate-bounce' : ''}`} />
      {isExporting ? 'Exportando...' : 'Exportar CSV'}
    </button>
  );
};

export default ExportButton;
