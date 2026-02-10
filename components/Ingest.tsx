import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { useClaims } from '../context/ClaimsContext';
import { processFiles } from '../services/excelParser';

const Ingest: React.FC = () => {
  const { setClaims } = useClaims();
  const [softFile, setSoftFile] = useState<File | null>(null);
  const [gestionFile, setGestionFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [stats, setStats] = useState<{ total: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: (f: File | null) => void) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const processData = async () => {
    if (!softFile || !gestionFile) return;
    setStatus('processing');
    try {
      const result = await processFiles(softFile, gestionFile);
      setClaims(result.claims);
      setStats({ total: result.stats.totalRows });
      setStatus('success');
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMsg('Error al procesar los archivos. Verifique el formato.');
    }
  };

  const FileDrop = ({ label, file, setFile, accept }: { label: string, file: File | null, setFile: (f: File | null) => void, accept: string }) => (
    <div className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${file ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-slate-800/30'}`}>
      <input
        type="file"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={(e) => handleFileChange(e, setFile)}
        accept={accept}
        disabled={status === 'processing'}
      />
      <div className="flex flex-col items-center pointer-events-none">
        {file ? (
          <>
            <FileSpreadsheet className="w-8 h-8 text-emerald-400 mb-2" />
            <p className="text-sm font-medium text-slate-200">{file.name}</p>
            <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB</p>
          </>
        ) : (
          <>
            <UploadCloud className="w-8 h-8 text-slate-500 mb-2" />
            <p className="text-sm font-medium text-slate-300">{label}</p>
            <p className="text-xs text-slate-500">Arrastre o clic aquí</p>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Ingesta y Unificación</h2>
        <p className="text-slate-400 text-sm">Cargue los archivos de <span className="text-blue-400">Softseguros</span> y <span className="text-amber-400">Gestión Interna</span> para sincronizar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <FileDrop label="Archivo Softseguros (CSV/Excel)" file={softFile} setFile={setSoftFile} accept=".csv,.xlsx,.xls" />
        <FileDrop label="Archivo Gestión 2026 (CSV/Excel)" file={gestionFile} setFile={setGestionFile} accept=".csv,.xlsx,.xls" />
      </div>

      <div className="flex justify-center mb-8">
        {status === 'processing' ? (
          <div className="flex items-center space-x-3 text-blue-400">
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            <span>Procesando y unificando datos...</span>
          </div>
        ) : status === 'success' ? (
          <div className="bg-emerald-900/30 border border-emerald-900/50 p-4 rounded-lg flex items-center space-x-4 animate-fade-in-up">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
            <div>
              <h3 className="font-bold text-white">¡Sincronización Exitosa!</h3>
              <p className="text-sm text-emerald-200/70">Se han procesado {stats?.total} registros correctamente.</p>
            </div>
          </div>
        ) : (
          <button
            onClick={processData}
            disabled={!softFile || !gestionFile}
            className={`flex items-center space-x-2 px-8 py-3 rounded-lg font-bold shadow-lg transition-all transform hover:scale-105
                ${(!softFile || !gestionFile) ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'}
             `}
          >
            <span>Iniciar Sincronización</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {status === 'error' && (
        <div className="bg-rose-900/20 border border-rose-900/50 p-4 rounded-lg flex items-center space-x-3 text-rose-300 mx-auto max-w-md">
          <AlertTriangle className="w-5 h-5" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};

export default Ingest;