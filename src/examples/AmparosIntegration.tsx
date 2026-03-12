import React, { useState } from 'react';
import { AmparosDropdown } from '../components/Amparos';
import { useClaimAmparos } from '../hooks/useAmparos';

/**
 * EXAMPLE: Integration of AmparosDropdown into claim creation form
 *
 * This is a reference implementation showing how to integrate the AmparosDropdown
 * component into an existing claim creation form.
 *
 * Usage in your actual form component:
 * 1. Import AmparosDropdown
 * 2. Manage selected amparos state
 * 3. Pass to API on form submission
 */

interface ClaimFormData {
  // ... other fields
  numero_siniestro: string;
  fecha_siniestro: string;
  aseguradora_id: string;
  // ... other fields
}

export const ClaimCreationFormExample: React.FC = () => {
  const [formData, setFormData] = useState<ClaimFormData>({
    numero_siniestro: '',
    fecha_siniestro: '',
    aseguradora_id: '',
  });

  // State for selected amparos
  const [selectedAmparos, setSelectedAmparos] = useState<string[]>([]);
  const [amparosError, setAmparosError] = useState<string | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate amparos
    if (selectedAmparos.length === 0) {
      setAmparosError('Debe seleccionar al menos un amparo');
      return;
    }

    try {
      // 1. Create claim first
      const claimResponse = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!claimResponse.ok) {
        throw new Error('Failed to create claim');
      }

      const claim = await claimResponse.json();

      // 2. Associate amparos with the claim
      const amparosResponse = await fetch(`/api/claims/${claim.id}/amparos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amparoIds: selectedAmparos }),
      });

      if (!amparosResponse.ok) {
        throw new Error('Failed to associate amparos');
      }

      // Success! Redirect or show success message
      alert('Siniestro creado exitosamente');
    } catch (error) {
      console.error('Error creating claim:', error);
      alert('Error al crear el siniestro');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Other form fields */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1">Número de Siniestro</label>
        <input
          type="text"
          value={formData.numero_siniestro}
          onChange={e => setFormData({ ...formData, numero_siniestro: e.target.value })}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
          required
        />
      </div>

      {/* ... other fields ... */}

      {/* Amparos Dropdown Integration */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1">Amparos Afectados *</label>
        <AmparosDropdown
          value={selectedAmparos}
          onChange={value => {
            setSelectedAmparos(value);
            setAmparosError(undefined); // Clear error on change
          }}
          placeholder="Seleccione los amparos afectados"
          required
          error={amparosError}
        />
        <p className="mt-1 text-sm text-slate-500">
          Seleccione uno o más amparos relacionados con este siniestro
        </p>
      </div>

      <button
        type="submit"
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
      >
        Crear Siniestro
      </button>
    </form>
  );
};

/**
 * EXAMPLE: Integration of AmparosDropdown into claim edit form
 *
 * This shows how to load existing amparos and update them.
 */

interface ClaimEditFormProps {
  claimId: string;
}

export const ClaimEditFormExample: React.FC<ClaimEditFormProps> = ({ claimId }) => {
  const [formData, setFormData] = useState<ClaimFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use the hook to manage amparos
  const { amparoIds, loading: amparosLoading, updateClaimAmparos } = useClaimAmparos(claimId);
  const [selectedAmparos, setSelectedAmparos] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Load claim data
  React.useEffect(() => {
    const loadClaim = async () => {
      try {
        const response = await fetch(`/api/claims/${claimId}`);
        if (response.ok) {
          const data = await response.json();
          setFormData(data);
        }
      } catch (error) {
        console.error('Error loading claim:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadClaim();
  }, [claimId]);

  // Sync selectedAmparos with loaded data
  React.useEffect(() => {
    if (amparoIds.length > 0) {
      setSelectedAmparos(amparoIds);
    }
  }, [amparoIds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setIsSaving(true);

    try {
      // 1. Update claim data
      const claimResponse = await fetch(`/api/claims/${claimId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!claimResponse.ok) {
        throw new Error('Failed to update claim');
      }

      // 2. Update amparos if changed
      if (JSON.stringify(selectedAmparos) !== JSON.stringify(amparoIds)) {
        await updateClaimAmparos(selectedAmparos);
      }

      alert('Siniestro actualizado exitosamente');
    } catch (error) {
      console.error('Error updating claim:', error);
      alert('Error al actualizar el siniestro');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || amparosLoading) {
    return <div className="p-4">Cargando...</div>;
  }

  if (!formData) {
    return <div className="p-4">Error al cargar el siniestro</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Other form fields with existing data */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1">Número de Siniestro</label>
        <input
          type="text"
          value={formData.numero_siniestro}
          onChange={e => setFormData({ ...formData, numero_siniestro: e.target.value })}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
        />
      </div>

      {/* ... other fields ... */}

      {/* Amparos Dropdown with existing values */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1">Amparos Afectados</label>
        <AmparosDropdown
          value={selectedAmparos}
          onChange={setSelectedAmparos}
          placeholder="Seleccione los amparos afectados"
          required
        />
        <p className="mt-1 text-sm text-slate-500">
          Los amparos seleccionados actualmente se muestran pre-seleccionados
        </p>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
      >
        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
      </button>
    </form>
  );
};

export default {
  ClaimCreationFormExample,
  ClaimEditFormExample,
};
