import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { Claim, User, FilterState, InternalState, StateHistoryEntry, TimelineEvent } from '../types';
import { INITIAL_CLAIMS, MOCK_USERS, WORKFLOW_PHASES } from '../constants';
import { supabase } from '../lib/supabase';

interface ClaimsContextType {
    claims: Claim[];
    users: User[];
    currentUser: User | null;
    filters: FilterState;

    setClaims: (claims: Claim[]) => void;
    setCurrentUser: (user: User | null) => void;
    setFilters: (filters: FilterState) => void;
    updateClaim: (updatedClaim: Claim) => void;
    changeClaimState: (claimId: string, newState: InternalState, author: string) => void;

    // Computed
    filteredClaims: Claim[];
}

const ClaimsContext = createContext<ClaimsContextType | undefined>(undefined);

export const ClaimsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [claims, setClaims] = useState<Claim[]>([]);
    const [users] = useState<User[]>(MOCK_USERS);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState<FilterState>({
        searchTerm: '',
        ramo: [],
        aseguradora: [],
        estado: [],
        tecnico: [],
        aliado: []
    });

    // Fetch claims from Supabase
    useEffect(() => {
        const fetchClaims = async () => {
            setIsLoading(true);
            try {
                // Fetch claims with their history and timeline
                const { data: claimsData, error: claimsError } = await supabase
                    .from('claims')
                    .select('*, state_history(*), timeline(*)');

                if (claimsError) throw claimsError;

                if (claimsData) {
                    const formattedClaims: Claim[] = claimsData.map((c: any) => ({
                        ...c,
                        stateHistory: c.state_history || [],
                        timeline: c.timeline || []
                    }));
                    setClaims(formattedClaims);
                }
            } catch (err) {
                console.error('Error fetching claims:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchClaims();
    }, []);

    const updateClaim = async (updatedClaim: Claim) => {
        // Optimistic update
        setClaims(prev => prev.map(c => c.id_softseguros === updatedClaim.id_softseguros ? updatedClaim : c));

        try {
            const { stateHistory, timeline, ...claimData } = updatedClaim;
            const { error } = await supabase
                .from('claims')
                .update(claimData)
                .eq('id_softseguros', updatedClaim.id_softseguros);

            if (error) throw error;
        } catch (err) {
            console.error('Error persisting claim:', err);
            // Revert on error if needed
        }
    };

    const changeClaimState = async (claimId: string, newState: InternalState, author: string) => {
        // Validate state
        const isValidState = WORKFLOW_PHASES.some(phase => phase.states.includes(newState));
        if (!isValidState) {
            console.error(`Invalid state transition: ${newState}`);
            return;
        }

        const claim = claims.find(c => c.id_softseguros === claimId);
        if (!claim || claim.estado_interno === newState) return;

        const now = new Date();
        const lastChange = claim.lastStateChangeDate ? new Date(claim.lastStateChangeDate) : new Date(claim.updatedAt);

        // Calculate duration of previous state
        const daysDuration = Math.ceil((now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24));

        // Create history entry for the PREVIOUS state
        const newHistoryEntry: StateHistoryEntry = {
            state: claim.estado_interno,
            startDate: lastChange.toISOString(),
            endDate: now.toISOString(),
            daysDuration,
            author: claim.tecnico_asignado // Capturing who was responsible during that state
        };

        // Create timeline entry
        const timelineEntry: TimelineEvent = {
            id: crypto.randomUUID(),
            date: now.toISOString(),
            author: 'Sistema',
            text: `Estado cambiado de ${claim.estado_interno} a ${newState} por ${author}`,
            isSystem: true
        };

        const updatedClaim: Claim = {
            ...claim,
            estado_interno: newState,
            lastStateChangeDate: now.toISOString(),
            stateHistory: [...(claim.stateHistory || []), newHistoryEntry],
            timeline: [timelineEntry, ...(claim.timeline || [])],
            updatedAt: now.toISOString()
        };

        // Optimistic update
        setClaims(prev => prev.map(c => c.id_softseguros === claimId ? updatedClaim : c));

        try {
            // Persist state change
            const { error: claimError } = await supabase
                .from('claims')
                .update({
                    estado_interno: updatedClaim.estado_interno,
                    lastStateChangeDate: updatedClaim.lastStateChangeDate,
                    updatedAt: updatedClaim.updatedAt
                })
                .eq('id_softseguros', claimId);

            if (claimError) throw claimError;

            // Persist new history entry
            await supabase.from('state_history').insert({
                claim_id: claimId,
                ...newHistoryEntry
            });

            // Persist new timeline entry
            await supabase.from('timeline').insert({
                claim_id: claimId,
                ...timelineEntry
            });

        } catch (err) {
            console.error('Error persisting state change:', err);
        }
    };

    const filteredClaims = useMemo(() => {
        return claims.filter(claim => {
            // Role-based filtering
            if (currentUser?.role === 'ALIADO') {
                if (claim.aliado_origen !== currentUser.aliadoId) return false;
            }

            // Search
            if (filters.searchTerm) {
                const search = filters.searchTerm.toLowerCase();
                const matches =
                    claim.numero_siniestro.toLowerCase().includes(search) ||
                    claim.poliza.toLowerCase().includes(search) ||
                    claim.placa_bien.toLowerCase().includes(search) ||
                    claim.asegurado.toLowerCase().includes(search);
                if (!matches) return false;
            }

            // Arrays
            if (filters.ramo.length > 0 && !filters.ramo.includes(claim.ramo)) return false;
            if (filters.aseguradora.length > 0 && !filters.aseguradora.includes(claim.aseguradora)) return false;
            if (filters.estado.length > 0 && !filters.estado.includes(claim.estado_interno)) return false;
            if (filters.tecnico.length > 0 && !filters.tecnico.includes(claim.tecnico_asignado)) return false;

            // Aliado filter (for admins)
            if (filters.aliado.length > 0 && claim.aliado_origen && !filters.aliado.includes(claim.aliado_origen)) return false;

            return true;
        });
    }, [claims, filters, currentUser]);

    return (
        <ClaimsContext.Provider value={{
            claims,
            users,
            currentUser,
            filters,
            setClaims,
            setCurrentUser,
            setFilters,
            updateClaim,
            changeClaimState,
            filteredClaims
        }}>
            {children}
        </ClaimsContext.Provider>
    );
};

export const useClaims = () => {
    const context = useContext(ClaimsContext);
    if (!context) throw new Error('useClaims must be used within a ClaimsProvider');
    return context;
};
