import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface Amparo {
  id: string;
  nombre: string;
  categoria: string;
  activo: boolean;
  created_at: string;
}

interface UseAmparosReturn {
  amparos: Amparo[];
  loading: boolean;
  error: string | null;
  addAmparo: (nombre: string, categoria?: string) => Promise<void>;
  updateAmparo: (id: string, updates: Partial<Amparo>) => Promise<void>;
  deleteAmparo: (id: string) => Promise<void>;
  refetch: () => void;
}

/**
 * Hook for managing amparos (coverage types)
 */
export function useAmparos(): UseAmparosReturn {
  const [amparos, setAmparos] = useState<Amparo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAmparos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('amparos')
        .select('*')
        .order('nombre');

      if (supabaseError) throw supabaseError;
      setAmparos(data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAmparos();
  }, [fetchAmparos]);

  const addAmparo = useCallback(
    async (nombre: string, categoria?: string) => {
      try {
        // Check for duplicates
        const { data: existing } = await supabase
          .from('amparos')
          .select('id')
          .eq('nombre', nombre)
          .single();

        if (existing) {
          throw new Error('Ya existe un amparo con este nombre');
        }

        const { error: insertError } = await supabase.from('amparos').insert({
          nombre,
          categoria: categoria || 'OTRO',
          activo: true,
        });

        if (insertError) throw insertError;
        await fetchAmparos();
      } catch (err) {
        throw err;
      }
    },
    [fetchAmparos]
  );

  const updateAmparo = useCallback(
    async (id: string, updates: Partial<Amparo>) => {
      try {
        const { error: updateError } = await supabase.from('amparos').update(updates).eq('id', id);

        if (updateError) throw updateError;
        await fetchAmparos();
      } catch (err) {
        throw err;
      }
    },
    [fetchAmparos]
  );

  const deleteAmparo = useCallback(
    async (id: string) => {
      try {
        // Soft delete - mark as inactive
        const { error: updateError } = await supabase
          .from('amparos')
          .update({ activo: false })
          .eq('id', id);

        if (updateError) throw updateError;
        await fetchAmparos();
      } catch (err) {
        throw err;
      }
    },
    [fetchAmparos]
  );

  return {
    amparos,
    loading,
    error,
    addAmparo,
    updateAmparo,
    deleteAmparo,
    refetch: fetchAmparos,
  };
}

/**
 * Hook for getting amparos for a specific claim
 */
export function useClaimAmparos(claimId: string | null) {
  const [amparoIds, setAmparoIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!claimId) {
      setAmparoIds([]);
      setLoading(false);
      return;
    }

    const fetchClaimAmparos = async () => {
      try {
        const { data, error } = await supabase
          .from('claim_amparos')
          .select('amparo_id')
          .eq('claim_id', claimId);

        if (error) throw error;
        setAmparoIds(data?.map(item => item.amparo_id) || []);
      } catch (err) {
        console.error('Error fetching claim amparos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClaimAmparos();
  }, [claimId]);

  const updateClaimAmparos = useCallback(
    async (newAmparoIds: string[]) => {
      if (!claimId) return;

      try {
        // Delete existing relationships
        await supabase.from('claim_amparos').delete().eq('claim_id', claimId);

        // Insert new relationships
        if (newAmparoIds.length > 0) {
          const records = newAmparoIds.map(amparoId => ({
            claim_id: claimId,
            amparo_id: amparoId,
          }));

          await supabase.from('claim_amparos').insert(records);
        }

        setAmparoIds(newAmparoIds);
      } catch (err) {
        console.error('Error updating claim amparos:', err);
        throw err;
      }
    },
    [claimId]
  );

  return { amparoIds, loading, updateClaimAmparos };
}
