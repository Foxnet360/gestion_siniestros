import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle } from 'lucide-react';

const Ingest: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const processFile = () => {
    if (!file) return;
    setStatus('processing');
    // Simulate Backend Delay
    setTimeout(() => {
      setStatus('success');
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Ingesta de Siniestros (Excel)</h2>
        <p className="text-slate-400">Sube el archivo <code className="bg-emerald-900/30 text-emerald-400 px-1 py-0.5 rounded">Siniestros.xlsx</code> generado por Softseguros.</p>
      </div>

      <div 
        className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300
          ${dragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-slate-800/30'}
          ${status === 'success' ? 'border-emerald-500/50 bg-emerald-900/10' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          onChange={handleChange}
          accept=".xlsx, .xls"
          disabled={status !== 'idle'}
        />

        {status === 'idle' && !file && (
          <div className="flex flex-col items-center pointer-events-none">
            <div className="bg-slate-800 p-4 rounded-full mb-4">
              <UploadCloud className="w-10 h-10 text-emerald-400" />
            </div>
            <p className="text-lg font-medium text-slate-200 mb-2">Arrastra tu archivo Excel aquí</p>
            <p className="text-sm text-slate-500">Soporta formatos .xlsx y .xls</p>
          </div>
        )}

        {status === 'idle' && file && (
          <div className="flex flex-col items-center pointer-events-none">
            <div className="bg-emerald-900/30 p-4 rounded-full mb-4">
              <FileSpreadsheet className="w-10 h-10 text-emerald-400" />
            </div>
            <p className="text-lg font-medium text-slate-200 mb-1">{file.name}</p>
            <p className="text-sm text-slate-500 mb-6">{(file.size / 1024).toFixed(2)} KB</p>
          </div>
        )}

        {status === 'processing' && (
           <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-200 font-medium">Leyendo filas de Excel...</p>
            <p className="text-sm text-slate-500 mt-2">Mapeando columnas...</p>
           </div>
        )}

        {status === 'success' && (
           <div className="flex flex-col items-center">
            <div className="bg-emerald-900/30 p-4 rounded-full mb-4">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <p className="text-lg font-bold text-white mb-1">¡Carga Completada!</p>
            <p className="text-sm text-slate-400 mb-4">Se procesaron correctamente las hojas de cálculo.</p>
            <button 
              onClick={() => { setFile(null); setStatus('idle'); }}
              className="z-10 relative bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Subir otro archivo
            </button>
           </div>
        )}
      </div>

      {status === 'idle' && file && (
        <div className="mt-6 flex justify-center">
          <button 
            onClick={processFile}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-105"
          >
            Procesar Excel
          </button>
        </div>
      )}

      <div className="mt-8 bg-amber-900/20 border border-amber-900/50 p-4 rounded-lg flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-amber-200">Nota Importante</h4>
          <p className="text-xs text-amber-200/70 mt-1">
            Asegúrese de que el archivo Excel no tenga celdas combinadas en el encabezado para garantizar una lectura correcta de la columna <code className="text-white">IDENTIFICADOR</code>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Ingest;