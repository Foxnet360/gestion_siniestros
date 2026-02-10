import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { Claim, User, FilterState } from '../types';
import { INITIAL_CLAIMS, MOCK_USERS } from '../constants';

interface ClaimsContextType {
    claims: Claim[];
    users: User[];
    currentUser: User | null;
    filters: FilterState;

    setClaims: (claims: Claim[]) => void;
    setCurrentUser: (user: User | null) => void;
    setFilters: (filters: FilterState) => void;
    updateClaim: (updatedClaim: Claim) => void;

    // Computed
    filteredClaims: Claim[];
}

const ClaimsContext = createContext<ClaimsContextType | undefined>(undefined);

export const ClaimsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [claims, setClaims] = useState<Claim[]>(INITIAL_CLAIMS);
    const [users] = useState<User[]>(MOCK_USERS);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [filters, setFilters] = useState<FilterState>({
        searchTerm: '',
        ramo: [],
        aseguradora: [],
        estado: [],
        tecnico: [],
        aliado: []
    });

    const updateClaim = (updatedClaim: Claim) => {
        setClaims(prev => prev.map(c => c.id_softseguros === updatedClaim.id_softseguros ? updatedClaim : c));
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
