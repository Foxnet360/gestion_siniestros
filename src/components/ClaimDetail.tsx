import React, { useState } from 'react';
import { Claim } from '../types';
import { ClaimDetailHeader } from './ClaimDetail/ClaimDetailHeader';
import { SoftSegurosPanel } from './ClaimDetail/SoftSegurosPanel';
import { TimelinePanel } from './ClaimDetail/TimelinePanel';
import EditTrackingTab from './EditTrackingTab';
import { FileText, Edit3 } from 'lucide-react';

interface ClaimDetailProps {
  claim: Claim;
  onClose: () => void;
  onUpdate: (updatedClaim: Claim) => void;
}

type TabType = 'bitacora' | 'editar';

/**
 * Modal de detalle de reclamo
 * Layout de 2 columnas:
 * - SoftSegurosPanel: Datos completos del siniestro (amplio)
 * - Right Panel: Tabs de Bitácora y Editar
 */
const ClaimDetail: React.FC<ClaimDetailProps> = ({ claim, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<TabType>('bitacora');

  const handleClaimUpdate = (updatedClaim: Claim) => {
    onUpdate(updatedClaim);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full h-full sm:w-[98vw] sm:h-[96vh] sm:rounded-2xl shadow-2xl border-0 sm:border sm:border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
        <ClaimDetailHeader claim={claim} onClose={onClose} />

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          {/* Panel izquierdo - Datos SoftSeguros (full on mobile, 70% on desktop) */}
          <div className="w-full lg:w-[70%] overflow-auto flex-shrink-0">
            <SoftSegurosPanel claim={claim} />
          </div>

          {/* Panel derecho - Tabs de Bitácora/Editar (full on mobile, 30% on desktop) */}
          <div className="w-full lg:w-[30%] flex flex-col overflow-hidden border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-700 min-h-0">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <button
                onClick={() => setActiveTab('bitacora')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'bitacora'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-slate-900'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                Bitácora
              </button>
              <button
                onClick={() => setActiveTab('editar')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'editar'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-slate-900'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                Editar
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'bitacora' && <TimelinePanel claim={claim} />}
              {activeTab === 'editar' && (
                <EditTrackingTab claim={claim} onUpdate={handleClaimUpdate} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimDetail;
