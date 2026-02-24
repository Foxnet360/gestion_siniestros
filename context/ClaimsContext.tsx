import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  useEffect,
  useCallback,
} from 'react';
import {
  Claim,
  User,
  FilterState,
  InternalState,
  StateHistoryEntry,
  TimelineEvent,
} from '../types';
import { MOCK_USERS, WORKFLOW_PHASES } from '../constants';
import { supabase } from '../lib/supabase';

export interface AppError {
  type: 'update' | 'state_change' | 'fetch' | 'ingest';
  message: string;
  claimId?: string;
  timestamp: Date;
}

interface ClaimsContextType {
  claims: Claim[];
  users: User[];
  currentUser: User | null;
  filters: FilterState;
  errors: AppError[];
  isLoading: boolean;
  isSearching: boolean;
  searchResults: Claim[];

  setClaims: (claims: Claim[]) => void;
  setCurrentUser: (user: User | null) => void;
  setFilters: (filters: FilterState) => void;
  updateClaim: (updatedClaim: Claim) => Promise<void>;
  changeClaimState: (
    claimId: string,
    newState: InternalState,
    author: string,
    note?: string
  ) => Promise<Claim | undefined>;
  addClaimNote: (claimId: string, note: Omit<TimelineEvent, 'id'>) => Promise<void>;
  refreshClaims: () => Promise<void>;
  clearError: (index: number) => void;

  // Computed
  filteredClaims: Claim[];
}

const ClaimsContext = createContext<ClaimsContextType | undefined>(undefined);

export const ClaimsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [users] = useState<User[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Claim[]>([]);
  const [errors, setErrors] = useState<AppError[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    ramo: [],
    aseguradora: [],
    estado: [],
    poliza: [],
    aliado: [],
  });

  const addError = useCallback((error: Omit<AppError, 'timestamp'>) => {
    setErrors(prev => [...prev, { ...error, timestamp: new Date() }]);
  }, []);

  const clearError = useCallback((index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Search claims server-side
  const searchClaimsServerSide = useCallback(
    async (searchTerm: string) => {
      const normalizedSearch = searchTerm.toLowerCase().trim();

      // Validate minimum search length
      if (normalizedSearch.length < 3) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        console.log('🔍 Buscando server-side:', normalizedSearch);

        const { data, error } = await supabase
          .from('claims')
          .select('*')
          .or(
            `numero_siniestro.ilike.%${normalizedSearch}%,` +
              `numero_siniestro_compania.ilike.%${normalizedSearch}%,` +
              `asegurado.ilike.%${normalizedSearch}%,` +
              `poliza.ilike.%${normalizedSearch}%,` +
              `aseguradora.ilike.%${normalizedSearch}%`
          );

        if (error) {
          console.error('❌ Error en búsqueda server-side:', error);
          throw error;
        }

        console.log('✅ Resultados de búsqueda:', data?.length || 0);

        // Load relations for search results
        if (data && data.length > 0) {
          const claimIds = data.map(c => c.id_softseguros);

          const [{ data: allHistory }, { data: allTimeline }] = await Promise.all([
            supabase.from('state_history').select('*').in('claim_id', claimIds),
            supabase.from('timeline').select('*').in('claim_id', claimIds),
          ]);

          const historyMap = new Map();
          const timelineMap = new Map();

          allHistory?.forEach(h => {
            if (!historyMap.has(h.claim_id)) {
              historyMap.set(h.claim_id, []);
            }
            historyMap.get(h.claim_id).push(h);
          });

          allTimeline?.forEach(t => {
            if (!timelineMap.has(t.claim_id)) {
              timelineMap.set(t.claim_id, []);
            }
            timelineMap.get(t.claim_id).push(t);
          });

          const resultsWithRelations = data.map(claim => ({
            ...(claim as Claim),
            stateHistory: historyMap.get(claim.id_softseguros) || [],
            timeline: timelineMap.get(claim.id_softseguros) || [],
          }));

          setSearchResults(resultsWithRelations);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error('❌ Error en búsqueda:', err);
        addError({
          type: 'fetch',
          message: `Error al buscar: ${err instanceof Error ? err.message : 'Desconocido'}`,
        });
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [addError]
  );

  // Fetch claims from Supabase
  const fetchClaims = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Fetching claims from Supabase...');
      console.log('URL:', import.meta.env.VITE_SUPABASE_URL);

      // Intentar primero solo con claims (sin relaciones)
      const { data: claimsData, error: claimsError } = await supabase
        .from('claims')
        .select('*')
        .limit(2000);

      if (claimsError) {
        console.error('❌ Error en consulta:', claimsError);
        throw claimsError;
      }

      console.log('✅ Claims recibidos:', claimsData?.length || 0);

      // DEBUG: Verificar campos del primer claim
      if (claimsData && claimsData.length > 0) {
        const firstClaim = claimsData[0];
        console.log('🔍 Primer claim:', {
          id: firstClaim.id_softseguros,
          numero_siniestro: firstClaim.numero_siniestro,
          numero_siniestro_compania: firstClaim.numero_siniestro_compania,
          aseguradora: firstClaim.aseguradora,
          keys: Object.keys(firstClaim).filter(
            k => k.includes('numero') || k.includes('siniestro')
          ),
        });
      }

      if (claimsData && claimsData.length > 0) {
        console.log('📊 Cargando relaciones para', claimsData.length, 'claims...');

        // Obtener todos los IDs de claims
        const claimIds = claimsData.map(c => c.id_softseguros);

        // Cargar TODOS los state_history en una sola consulta
        const { data: allHistory } = await supabase
          .from('state_history')
          .select('*')
          .in('claim_id', claimIds);

        // Cargar TODOS los timeline en una sola consulta
        const { data: allTimeline } = await supabase
          .from('timeline')
          .select('*')
          .in('claim_id', claimIds);

        console.log('✅ Relaciones cargadas:', {
          history: allHistory?.length || 0,
          timeline: allTimeline?.length || 0,
        });

        // Crear mapas para acceso rápido
        const historyMap = new Map();
        const timelineMap = new Map();

        allHistory?.forEach(h => {
          if (!historyMap.has(h.claim_id)) {
            historyMap.set(h.claim_id, []);
          }
          historyMap.get(h.claim_id).push(h);
        });

        allTimeline?.forEach(t => {
          if (!timelineMap.has(t.claim_id)) {
            timelineMap.set(t.claim_id, []);
          }
          timelineMap.get(t.claim_id).push(t);
        });

        // Combinar claims con sus relaciones
        const claimsWithRelations = claimsData.map(claim => ({
          ...(claim as Claim),
          stateHistory: historyMap.get(claim.id_softseguros) || [],
          timeline: timelineMap.get(claim.id_softseguros) || [],
        }));

        setClaims(claimsWithRelations);
        console.log('✅ Claims procesados:', claimsWithRelations.length);
      } else {
        setClaims([]);
      }
    } catch (err) {
      console.error('❌ Error fetching claims:', err);
      addError({
        type: 'fetch',
        message: `Error al cargar los reclamos: ${err instanceof Error ? err.message : 'Desconocido'}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [addError]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Auto-search when searchTerm changes
  useEffect(() => {
    if (filters.searchTerm && filters.searchTerm.trim().length >= 3) {
      searchClaimsServerSide(filters.searchTerm);
    } else {
      setSearchResults([]);
    }
  }, [filters.searchTerm, searchClaimsServerSide]);

  const refreshClaims = useCallback(async () => {
    await fetchClaims();
  }, [fetchClaims]);

  const updateClaim = useCallback(
    async (updatedClaim: Claim) => {
      // Guardar estado anterior para rollback
      const previousClaims = [...claims];

      // Optimistic update
      setClaims(prev =>
        prev.map(c => (c.id_softseguros === updatedClaim.id_softseguros ? updatedClaim : c))
      );

      try {
        // Remove relational and computed fields that are not columns in 'claims' table
        const { stateHistory, timeline, ...rest } = updatedClaim;

        // Also remove snake_case keys that might have been included from raw join results
        const { state_history, timeline: _t, amparos, ...claimData } = rest as any;

        const { error } = await supabase
          .from('claims')
          .update(claimData)
          .eq('id_softseguros', updatedClaim.id_softseguros);

        if (error) throw error;
      } catch (err) {
        console.error('Error persisting claim:', err);
        // Rollback
        setClaims(previousClaims);
        addError({
          type: 'update',
          message: `Error al guardar cambios en reclamo ${updatedClaim.numero_siniestro}. Los cambios no se aplicaron.`,
          claimId: updatedClaim.id_softseguros,
        });
        throw err;
      }
    },
    [claims, addError]
  );

  const changeClaimState = useCallback(
    async (
      claimId: string,
      newState: InternalState,
      author: string,
      note?: string
    ): Promise<Claim | undefined> => {
      // Validate state
      const isValidState = WORKFLOW_PHASES.some(phase => phase.states.includes(newState));
      if (!isValidState) {
        addError({
          type: 'state_change',
          message: `Transición de estado inválida: ${newState}`,
          claimId,
        });
        return;
      }

      const claim = claims.find(c => c.id_softseguros === claimId);
      if (!claim || claim.estado_interno === newState) return;

      // Guardar estado anterior para rollback
      const previousClaims = [...claims];

      const now = new Date();
      const lastChange = claim.lastStateChangeDate
        ? new Date(claim.lastStateChangeDate)
        : new Date(claim.updatedAt || claim.lastStateChangeDate || now);

      const daysDuration = Math.ceil(
        (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24)
      );

      const newHistoryEntry: StateHistoryEntry = {
        state: claim.estado_interno,
        startDate: lastChange.toISOString(),
        endDate: now.toISOString(),
        daysDuration: Math.max(0, daysDuration), // Ensure non-negative
        author: author, // Use the person making the change
      };

      // Formato solicitado: "Fecha: 25/04/2024 - Funcionario: Sandra Echeverri - Seg: "FINALIZADO" [Nota]"
      const formattedDate = now.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      const timelineText = `Fecha: ${formattedDate} - Funcionario: ${author} - Seg: "${newState}"${note ? ` ${note}` : ''}`;

      const timelineEntry: TimelineEvent = {
        id: crypto.randomUUID(),
        date: now.toISOString(),
        author: author,
        text: timelineText,
        isSystem: true,
      };

      const updatedClaim: Claim = {
        ...claim,
        estado_interno: newState,
        lastStateChangeDate: now.toISOString(),
        stateHistory: [newHistoryEntry, ...(claim.stateHistory || [])],
        timeline: [timelineEntry, ...(claim.timeline || [])],
        updatedAt: now.toISOString(),
      };

      // Optimistic update
      setClaims(prev => prev.map(c => (c.id_softseguros === claimId ? updatedClaim : c)));

      const timelineToPersist = {
        claim_id: claimId,
        date: timelineEntry.date,
        author: timelineEntry.author,
        text: timelineEntry.text,
        isSystem: timelineEntry.isSystem,
      };

      try {
        const { error: claimError } = await supabase
          .from('claims')
          .update({
            estado_interno: updatedClaim.estado_interno,
            lastStateChangeDate: updatedClaim.lastStateChangeDate,
            updatedAt: updatedClaim.updatedAt,
          })
          .eq('id_softseguros', claimId);

        if (claimError) throw claimError;

        await supabase.from('state_history').insert({
          claim_id: claimId,
          state: newHistoryEntry.state,
          startDate: newHistoryEntry.startDate,
          endDate: newHistoryEntry.endDate,
          daysDuration: newHistoryEntry.daysDuration,
          author: newHistoryEntry.author,
        });

        await supabase.from('timeline').insert(timelineToPersist);

        return updatedClaim;
      } catch (err) {
        console.error('Error persisting state change:', err);
        // Rollback
        setClaims(previousClaims);
        addError({
          type: 'state_change',
          message: `Error al cambiar estado de ${claim.numero_siniestro}. La operación no se realizó.`,
          claimId,
        });
        throw err;
      }
    },
    [claims, addError]
  );

  const addClaimNote = useCallback(
    async (claimId: string, note: Omit<TimelineEvent, 'id'>) => {
      const claim = claims.find(c => c.id_softseguros === claimId);
      if (!claim) return;

      const newEvent: TimelineEvent = {
        ...note,
        id: crypto.randomUUID(),
      };

      // Optimistic update
      setClaims(prev =>
        prev.map(c =>
          c.id_softseguros === claimId
            ? { ...c, timeline: [newEvent, ...c.timeline], updatedAt: new Date().toISOString() }
            : c
        )
      );

      try {
        const { error } = await supabase.from('timeline').insert({
          claim_id: claimId,
          date: newEvent.date,
          author: newEvent.author,
          text: newEvent.text,
          isSystem: newEvent.isSystem,
        });

        if (error) throw error;
      } catch (err) {
        console.error('Error persisting note:', err);
        addError({
          type: 'update',
          message: 'Error al guardar la nota. Intente nuevamente.',
          claimId,
        });
        // Refrescar para sincronizar estado real si falló
        fetchClaims();
      }
    },
    [claims, addError, fetchClaims]
  );

  const filteredClaims = useMemo(() => {
    // Use server-side search results when searchTerm has 3+ characters
    const baseClaims =
      filters.searchTerm && filters.searchTerm.trim().length >= 3 ? searchResults : claims;

    return baseClaims.filter(claim => {
      if (currentUser?.role === 'ALIADO') {
        if (claim.aliado_origen !== currentUser.aliadoId) return false;
      }

      // Apply dropdown filters (always client-side)
      if (filters.ramo.length > 0 && !filters.ramo.includes(claim.ramo)) return false;
      if (filters.aseguradora.length > 0 && !filters.aseguradora.includes(claim.aseguradora))
        return false;
      if (filters.estado.length > 0 && !filters.estado.includes(claim.estado_interno)) return false;
      if (filters.poliza.length > 0 && !filters.poliza.includes(claim.poliza)) return false;
      if (
        filters.aliado.length > 0 &&
        claim.aliado_origen &&
        !filters.aliado.includes(claim.aliado_origen)
      )
        return false;

      return true;
    });
  }, [claims, searchResults, filters, currentUser]);

  return (
    <ClaimsContext.Provider
      value={{
        claims,
        users,
        currentUser,
        filters,
        errors,
        isLoading,
        isSearching,
        searchResults,
        setClaims,
        setCurrentUser,
        setFilters,
        updateClaim,
        changeClaimState,
        addClaimNote,
        refreshClaims,
        clearError,
        filteredClaims,
      }}
    >
      {children}
    </ClaimsContext.Provider>
  );
};

export const useClaims = () => {
  const context = useContext(ClaimsContext);
  if (!context) throw new Error('useClaims must be used within a ClaimsProvider');
  return context;
};
