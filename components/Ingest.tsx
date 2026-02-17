import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { useClaims } from '../context/ClaimsContext';
import { processFiles } from '../services/excelParser';
import { ingestClaims, IngestionReport } from '../services/mergeService';

const Ingest: React.FC = () => {
  const { refreshClaims } = useClaims();
  const [softFile, setSoftFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [report, setReport] = useState<IngestionReport | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: (f: File | null) => void) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const processData = async () => {
    if (!softFile) return;
    setStatus('processing');
    try {
      // Parse Excel file
      const parseResult = await processFiles(softFile);

      // Perform smart merge ingestion
      const ingestionReport = await ingestClaims(parseResult.claims, parseResult.amparos);

      setReport(ingestionReport);
      setStatus('success');

      // Refresh claims from database
      if (refreshClaims) {
        await refreshClaims();
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMsg('Error al procesar los archivos. Verifique el formato.');
    }
  };

  const FileDrop = ({ label, file, setFile, accept }: { label: string, file: File | null, setFile: (f: File | null) => void, accept: string }) => (
    <div className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 group
      ${file
        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
      }`}>
      <input
        type="file"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        onChange={(e) => handleFileChange(e, setFile)}
        accept={accept}
        disabled={status === 'processing'}
      />
      <div className="flex flex-col items-center pointer-events-none relative z-20">
        {file ? (
          <>
            <div className="bg-emerald-100 dark:bg-emerald-500/20 p-3 rounded-full mb-3">
              <FileSpreadsheet className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{file.name}</p>
            <p className="text-xs text-slate-500 font-medium">{(file.size / 1024).toFixed(0)} KB</p>
          </>
        ) : (
          <>
            <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-full mb-3 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors">
              <UploadCloud className="w-8 h-8 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{label}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Arrastre o haga clic para seleccionar</p>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Ingesta Inteligente</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
          Cargue el archivo mensual de <span className="font-semibold text-blue-600 dark:text-blue-400">SoftSeguros</span> para sincronizar automáticamente el estado de los siniestros.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8 max-w-md mx-auto">
        <FileDrop label="Archivo SoftSeguros (Excel)" file={softFile} setFile={setSoftFile} accept=".xlsx,.xls" />
      </div>

      <div className="flex justify-center mb-8">
        {status === 'processing' ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-3 rounded-full flex items-center space-x-3 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            <span className="font-medium">Procesando y fusionando datos...</span>
          </div>
        ) : status === 'success' && report ? (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/50 p-6 rounded-2xl animate-fade-in-up w-full max-w-2xl shadow-sm">
            <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-emerald-100 dark:border-emerald-800/50">
              <div className="bg-emerald-100 dark:bg-emerald-800/50 p-3 rounded-full">
                <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-emerald-900 dark:text-white">¡Sincronización Exitosa!</h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-200/70 mt-1">
                  Procesado correctamente en <span className="font-mono font-bold bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded text-emerald-800 dark:text-emerald-200">{report.duration_ms}ms</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">Claims</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center group">
                    <span className="text-slate-600 dark:text-slate-400">Nuevos:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">{report.claims.created}</span>
                  </div>
                  <div className="flex justify-between items-center group">
                    <span className="text-slate-600 dark:text-slate-400">Actualizados:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">{report.claims.updated}</span>
                  </div>
                  <div className="flex justify-between items-center group">
                    <span className="text-slate-600 dark:text-slate-400">Sin cambios:</span>
                    <span className="font-bold text-slate-600 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{report.claims.unchanged}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">Amparos</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center group">
                    <span className="text-slate-600 dark:text-slate-400">Nuevos:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">{report.amparos.inserted}</span>
                  </div>
                  <div className="flex justify-between items-center group">
                    <span className="text-slate-600 dark:text-slate-400">Actualizados:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">{report.amparos.updated}</span>
                  </div>
                  <div className="flex justify-between items-center group">
                    <span className="text-slate-600 dark:text-slate-400">Eliminados:</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded">{report.amparos.deleted}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={processData}
            disabled={!softFile}
            className={`flex items-center space-x-2 px-8 py-3 rounded-lg font-bold shadow-lg transition-all transform hover:scale-105
                ${!softFile
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'}
             `}
          >
            <span>Iniciar Sincronización</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {status === 'error' && (
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/50 p-4 rounded-lg flex items-center space-x-3 text-rose-700 dark:text-rose-300 mx-auto max-w-md animate-shake">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}
    </div>
  );
};

export default Ingest;