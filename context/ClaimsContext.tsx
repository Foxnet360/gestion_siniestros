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

  setClaims: (claims: Claim[]) => void;
  setCurrentUser: (user: User | null) => void;
  setFilters: (filters: FilterState) => void;
  updateClaim: (updatedClaim: Claim) => Promise<void>;
  changeClaimState: (
    claimId: string,
    newState: InternalState,
    author: string
  ) => Promise<void>;
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
  const [errors, setErrors] = useState<AppError[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    ramo: [],
    aseguradora: [],
    estado: [],
    tecnico: [],
    aliado: [],
  });

  const addError = useCallback((error: Omit<AppError, 'timestamp'>) => {
    setErrors(prev => [
      ...prev,
      { ...error, timestamp: new Date() },
    ]);
  }, []);

  const clearError = useCallback((index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Fetch claims from Supabase
  const fetchClaims = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: claimsData, error: claimsError } = await supabase
        .from('claims')
        .select('*, state_history(*), timeline(*)');

      if (claimsError) throw claimsError;

      if (claimsData) {
        const formattedClaims: Claim[] = claimsData.map((c: unknown) => ({
          ...(c as Claim),
          stateHistory: (c as { state_history?: StateHistoryEntry[] }).state_history || [],
          timeline: (c as { timeline?: TimelineEvent[] }).timeline || [],
        }));
        setClaims(formattedClaims);
      }
    } catch (err) {
      console.error('Error fetching claims:', err);
      addError({
        type: 'fetch',
        message: 'Error al cargar los reclamos. Por favor, intente nuevamente.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [addError]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const refreshClaims = useCallback(async () => {
    await fetchClaims();
  }, [fetchClaims]);

  const updateClaim = useCallback(
    async (updatedClaim: Claim) => {
      // Guardar estado anterior para rollback
      const previousClaims = [...claims];

      // Optimistic update
      setClaims(prev =>
        prev.map(c =>
          c.id_softseguros === updatedClaim.id_softseguros ? updatedClaim : c
        )
      );

      try {
        const { stateHistory, timeline, ...claimData } = updatedClaim;
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
    async (claimId: string, newState: InternalState, author: string) => {
      // Validate state
      const isValidState = WORKFLOW_PHASES.some(phase =>
        phase.states.includes(newState)
      );
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
        : new Date(claim.updatedAt);

      const daysDuration = Math.ceil(
        (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24)
      );

      const newHistoryEntry: StateHistoryEntry = {
        state: claim.estado_interno,
        startDate: lastChange.toISOString(),
        endDate: now.toISOString(),
        daysDuration,
        author: claim.tecnico_asignado,
      };

      const timelineEntry: TimelineEvent = {
        id: crypto.randomUUID(),
        date: now.toISOString(),
        author: 'Sistema',
        text: `Estado cambiado de ${claim.estado_interno} a ${newState} por ${author}`,
        isSystem: true,
      };

      const updatedClaim: Claim = {
        ...claim,
        estado_interno: newState,
        lastStateChangeDate: now.toISOString(),
        stateHistory: [...(claim.stateHistory || []), newHistoryEntry],
        timeline: [timelineEntry, ...(claim.timeline || [])],
        updatedAt: now.toISOString(),
      };

      // Optimistic update
      setClaims(prev => prev.map(c => (c.id_softseguros === claimId ? updatedClaim : c)));

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
          ...newHistoryEntry,
        });

        await supabase.from('timeline').insert({
          claim_id: claimId,
          ...timelineEntry,
        });
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

  const filteredClaims = useMemo(() => {
    return claims.filter(claim => {
      if (currentUser?.role === 'ALIADO') {
        if (claim.aliado_origen !== currentUser.aliadoId) return false;
      }

      if (filters.searchTerm) {
        const search = filters.searchTerm.toLowerCase();
        const matches =
          claim.numero_siniestro.toLowerCase().includes(search) ||
          claim.poliza.toLowerCase().includes(search) ||
          claim.placa_bien.toLowerCase().includes(search) ||
          claim.asegurado.toLowerCase().includes(search);
        if (!matches) return false;
      }

      if (filters.ramo.length > 0 && !filters.ramo.includes(claim.ramo)) return false;
      if (filters.aseguradora.length > 0 && !filters.aseguradora.includes(claim.aseguradora))
        return false;
      if (filters.estado.length > 0 && !filters.estado.includes(claim.estado_interno))
        return false;
      if (filters.tecnico.length > 0 && !filters.tecnico.includes(claim.tecnico_asignado))
        return false;
      if (filters.aliado.length > 0 && claim.aliado_origen &&
        !filters.aliado.includes(claim.aliado_origen))
        return false;

      return true;
    });
  }, [claims, filters, currentUser]);

  return (
    <ClaimsContext.Provider
      value={{
        claims,
        users,
        currentUser,
        filters,
        errors,
        isLoading,
        setClaims,
        setCurrentUser,
        setFilters,
        updateClaim,
        changeClaimState,
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
