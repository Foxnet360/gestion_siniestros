import React from 'react';
import { Claim } from '../../types';
import { Save, Shield, X } from 'lucide-react';

interface ClaimDetailHeaderProps {
  claim: Claim;
  onClose: () => void;
  onSave: () => void;
}

/**
 * Header del modal de ClaimDetail
 * Muestra información identificadora y acciones principales
 */
export const ClaimDetailHeader: React.FC<ClaimDetailHeaderProps> = ({
  claim,
  onClose,
  onSave,
}) => {
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
          </h2>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={onSave}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Guardar Cambios</span>
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
