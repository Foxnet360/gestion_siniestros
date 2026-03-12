import React, { createContext, useContext, useState, useCallback } from 'react';
import type { FilterState } from '../../types/dashboard';

interface DashboardFiltersContextType {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
}

const defaultFilters: FilterState = {
  aseguradora: null,
  ramo: [],
  vendedor: null,
  tecnico: null,
  asegurado: null,
  dateRange: {
    start: null,
    end: null,
  },
};

const DashboardFiltersContext = createContext<DashboardFiltersContextType | undefined>(undefined);

export const DashboardFiltersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  return (
    <DashboardFiltersContext.Provider value={{ filters, setFilters, updateFilter, resetFilters }}>
      {children}
    </DashboardFiltersContext.Provider>
  );
};

export const useDashboardFilters = (): DashboardFiltersContextType => {
  const context = useContext(DashboardFiltersContext);
  if (context === undefined) {
    throw new Error('useDashboardFilters must be used within a DashboardFiltersProvider');
  }
  return context;
};
