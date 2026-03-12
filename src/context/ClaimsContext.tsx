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
import { WORKFLOW_PHASES } from '../constants';
import { supabase } from '../lib/supabase';
import { fromDbFormat, fromDbFormatArray, toDbFormat } from '../lib/dbMapping';
import { useAuth } from './AuthContext';
import { logAction, AuditActions } from '../services/auditService';

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
  const { user: currentUser } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Claim[]>([]);
  const [errors, setErrors] = useState<AppError[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    ramo: [],
    aseguradora: [],
    estado: [],
    asegurado: [],
    aliado: [],
    tecnico: [],
    vendedor: [],
    showFinished: false,
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

        // Convertir de formato BD (lowercase) a formato Claim (camelCase)
        const dataFormatted = data ? fromDbFormatArray(data) : [];

        // Load relations for search results
        if (dataFormatted.length > 0) {
          const claimIds = dataFormatted.map(c => c.id_softseguros);

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

          const resultsWithRelations = dataFormatted.map(claim => ({
            ...claim,
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

  // Fetch users from Supabase
  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('is_active', true);

      if (error) throw error;

      setUsers(
        data?.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          initials: u.initials,
          aliadoId: u.aliado_id,
          isActive: u.is_active,
        })) || []
      );
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }, []);

  // Fetch claims from Supabase
  const fetchClaims = useCallback(async () => {
    setIsLoading(true);
    try {
      // Cargar usuarios primero
      await fetchUsers();

      console.log('🔍 Fetching claims from Supabase...');

      // Intentar primero solo con claims (sin relaciones)
      const { data: claimsData, error: claimsError } = await supabase
        .from('claims')
        .select('*')
        .limit(2000);

      if (claimsError) {
        console.error('❌ Error en consulta:', claimsError);
        throw claimsError;
      }

      // Convertir de formato BD (lowercase) a formato Claim (camelCase)
      const claimsDataFormatted = claimsData ? fromDbFormatArray(claimsData) : [];

      console.log('✅ Claims recibidos:', claimsDataFormatted?.length || 0);

      // DEBUG: Verificar campos del primer claim
      if (claimsDataFormatted.length > 0) {
        const firstClaim = claimsDataFormatted[0];
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

      if (claimsDataFormatted.length > 0) {
        console.log('📊 Cargando relaciones para', claimsDataFormatted.length, 'claims...');

        // Obtener todos los IDs de claims
        const claimIds = claimsDataFormatted.map(c => c.id_softseguros);

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
        const claimsWithRelations = claimsDataFormatted.map(claim => ({
          ...claim,
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
    if (currentUser) {
      fetchClaims();
    }
  }, [fetchClaims, currentUser]);

  // Auto-search when searchTerm changes
  useEffect(() => {
    if (currentUser && filters.searchTerm && filters.searchTerm.trim().length >= 3) {
      searchClaimsServerSide(filters.searchTerm);
    } else {
      setSearchResults([]);
    }
  }, [filters.searchTerm, searchClaimsServerSide, currentUser]);

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
          .update(toDbFormat(claimData))
          .eq('id_softseguros', updatedClaim.id_softseguros);

        if (error) throw error;

        // Registrar en auditoría
        await logAction(AuditActions.UPDATE_CLAIM, 'claim', updatedClaim.id_softseguros, {
          numero_siniestro: updatedClaim.numero_siniestro,
        });
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
          .update(
            toDbFormat({
              estado_interno: updatedClaim.estado_interno,
              lastStateChangeDate: updatedClaim.lastStateChangeDate,
              updatedAt: updatedClaim.updatedAt,
            })
          )
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

        // Registrar en auditoría
        await logAction(AuditActions.CHANGE_CLAIM_STATE, 'claim', claimId, {
          old_state: claim.estado_interno,
          new_state: newState,
          numero_siniestro: claim.numero_siniestro,
        });

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

      if (currentUser?.role === 'TECNICO') {
        if (claim.tecnico_asignado !== currentUser.name) return false;
      }

      if (currentUser?.role === 'VENDEDOR') {
        if (claim.vendedor !== currentUser.name) return false;
      }

      // Apply dropdown filters (always client-side)
      if (filters.ramo.length > 0 && !filters.ramo.includes(claim.ramo)) return false;
      if (filters.aseguradora.length > 0 && !filters.aseguradora.includes(claim.aseguradora))
        return false;
      if (filters.estado.length > 0 && !filters.estado.includes(claim.estado_interno)) return false;
      if (filters.asegurado.length > 0 && !filters.asegurado.includes(claim.asegurado))
        return false;
      if (
        filters.aliado.length > 0 &&
        !filters.aliado.includes(claim.aliado_origen)
      )
        return false;

      // New filters
      if (
        filters.tecnico &&
        filters.tecnico.length > 0 &&
        !filters.tecnico.includes(claim.tecnico_asignado)
      )
        return false;
      if (
        filters.vendedor &&
        filters.vendedor.length > 0 &&
        !filters.vendedor.includes(claim.vendedor)
      )
        return false;

      // Toggle activos / finalizados
      const isFinalized =
        claim.estado_interno === 'FINALIZADO' ||
        claim.estado_interno === 'PAGADO' ||
        claim.finalizado === true;

      if (filters.showFinished && !isFinalized) return false;
      if (!filters.showFinished && isFinalized) return false;

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
