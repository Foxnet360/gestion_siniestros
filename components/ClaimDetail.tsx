import React from 'react';
import { Claim } from '../types';
import { ClaimDetailHeader } from './ClaimDetail/ClaimDetailHeader';
import { SoftSegurosPanel } from './ClaimDetail/SoftSegurosPanel';
import { TimelinePanel } from './ClaimDetail/TimelinePanel';

interface ClaimDetailProps {
  claim: Claim;
  onClose: () => void;
  onUpdate: (updatedClaim: Claim) => void;
}

/**
 * Modal de detalle de reclamo
 * Layout de 2 columnas:
 * - SoftSegurosPanel: Datos completos del siniestro (amplio)
 * - TimelinePanel: Bitácora y seguimiento
 */
const ClaimDetail: React.FC<ClaimDetailProps> = ({ claim, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
        <ClaimDetailHeader claim={claim} onClose={onClose} />

        <div className="flex-1 flex overflow-hidden">
          {/* Panel izquierdo - Datos SoftSeguros (70%) */}
          <div className="w-[70%] overflow-hidden">
            <SoftSegurosPanel claim={claim} />
          </div>

          {/* Panel derecho - Bitácora (30%) */}
          <div className="w-[30%] overflow-hidden">
            <TimelinePanel claim={claim} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimDetail;
