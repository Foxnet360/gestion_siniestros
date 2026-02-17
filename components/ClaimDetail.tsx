import React, { useState, useCallback } from 'react';
import { Claim, InternalState, TimelineEvent } from '../types';
import { useClaims } from '../context/ClaimsContext';
import { ClaimDetailHeader } from './ClaimDetail/ClaimDetailHeader';
import { SoftSegurosPanel } from './ClaimDetail/SoftSegurosPanel';
import { ManagementPanel } from './ClaimDetail/ManagementPanel';
import { TimelinePanel } from './ClaimDetail/TimelinePanel';

interface ClaimDetailProps {
  claim: Claim;
  onClose: () => void;
  onUpdate: (updatedClaim: Claim) => void;
  onChangeState: (newState: InternalState) => void;
}

/**
 * Modal de detalle de reclamo
 * Refactorizado en componentes especializados:
 * - ClaimDetailHeader: Header con acciones
 * - SoftSegurosPanel: Datos de origen (solo lectura)
 * - ManagementPanel: Gestión y finanzas
 * - TimelinePanel: Bitácora y notas
 */
const ClaimDetail: React.FC<ClaimDetailProps> = ({
  claim,
  onClose,
  onUpdate,
  onChangeState,
}) => {
  const { currentUser } = useClaims();
  const [formData, setFormData] = useState<Claim>(claim);

  /**
   * Actualiza un campo del formulario
   */
  const handleChange = useCallback((field: keyof Claim, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Maneja cambio de estado del claim
   */
  const handleStateChange = useCallback(
    (newState: InternalState) => {
      if (newState === claim.estado_interno) return;
      onChangeState(newState);
    },
    [claim.estado_interno, onChangeState]
  );

  /**
   * Guarda los cambios del formulario
   */
  const handleSave = useCallback(() => {
    onUpdate(formData);
  }, [formData, onUpdate]);

  /**
   * Agrega una nueva nota al timeline
   */
  const handleAddNote = useCallback(
    (note: Omit<TimelineEvent, 'id'>) => {
      const newEvent: TimelineEvent = {
        ...note,
        id: crypto.randomUUID(),
      };

      const updated: Claim = {
        ...formData,
        timeline: [newEvent, ...formData.timeline],
        updatedAt: new Date().toISOString(),
      };

      setFormData(updated);
      // Auto-guardar al agregar nota
      onUpdate(updated);
    },
    [formData, onUpdate]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
        <ClaimDetailHeader
          claim={claim}
          onClose={onClose}
          onSave={handleSave}
        />

        <div className="flex-1 flex overflow-hidden">
          <SoftSegurosPanel claim={claim} />

          <ManagementPanel
            claim={claim}
            formData={formData}
            onChange={handleChange}
            onStateChange={handleStateChange}
          />

          <TimelinePanel
            claim={claim}
            onAddNote={handleAddNote}
            currentUserName={currentUser?.name}
          />
        </div>
      </div>
    </div>
  );
};

export default ClaimDetail;
