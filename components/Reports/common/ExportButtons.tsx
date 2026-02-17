import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Settings } from 'lucide-react';
import type { ExportOptions } from '../../../types/reports';

interface ExportButtonsProps {
  onExportExcel: (options: ExportOptions) => void;
  onExportPDF: (options: ExportOptions) => void;
  disabled?: boolean;
}

const defaultOptions: ExportOptions = {
  includeCharts: true,
  includeTables: true,
  dateRange: null,
  sections: [],
  numberFormat: {
    thousandsSeparator: ',',
    decimalSeparator: '.',
    decimalPlaces: 2,
  },
};

const ExportButtons: React.FC<ExportButtonsProps> = ({
  onExportExcel,
  onExportPDF,
  disabled = false,
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<ExportOptions>(defaultOptions);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onExportExcel(options)}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 
                     disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg
                     transition-colors text-sm font-medium"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Excel
        </button>

        <button
          onClick={() => onExportPDF(options)}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 
                     disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg
                     transition-colors text-sm font-medium"
        >
          <FileText className="w-4 h-4" />
          PDF
        </button>

        <button
          onClick={() => setShowOptions(!showOptions)}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          title="Opciones de exportación"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {showOptions && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowOptions(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 
                          rounded-xl shadow-xl shadow-black/5 dark:shadow-black/20 z-50 p-4"
          >
            <h4 className="font-bold text-slate-900 dark:text-white mb-4">Opciones de Exportación</h4>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Incluir gráficos</label>
                <input
                  type="checkbox"
                  checked={options.includeCharts}
                  onChange={(e) =>
                    setOptions({ ...options, includeCharts: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-blue-600
                             focus:ring-blue-500/50"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Incluir tablas</label>
                <input
                  type="checkbox"
                  checked={options.includeTables}
                  onChange={(e) =>
                    setOptions({ ...options, includeTables: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-blue-600
                             focus:ring-blue-500/50"
                />
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-500 mb-2 uppercase tracking-wider">Formato de números</p>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Separador miles</label>
                    <input
                      type="text"
                      value={options.numberFormat.thousandsSeparator}
                      onChange={(e) =>
                        setOptions({
                          ...options,
                          numberFormat: {
                            ...options.numberFormat,
                            thousandsSeparator: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5
                                 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Separador decimal</label>
                    <input
                      type="text"
                      value={options.numberFormat.decimalSeparator}
                      onChange={(e) =>
                        setOptions({
                          ...options,
                          numberFormat: {
                            ...options.numberFormat,
                            decimalSeparator: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5
                                 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButtons;
