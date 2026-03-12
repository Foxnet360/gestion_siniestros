import { useMemo } from 'react';
import type { Claim } from '../../types';
import type { ReportFilters } from '../../types/reports';
import { useKpiFinancieros } from './useKpiFinancieros';

interface KpiComparison {
  current: ReturnType<typeof useKpiFinancieros>;
  previous: ReturnType<typeof useKpiFinancieros>;
}

export function useKpiComparison(
  claims: Claim[],
  filters: ReportFilters
): KpiComparison {
  // Calculate current period KPIs
  const current = useKpiFinancieros(claims, filters);

  // Calculate previous period KPIs
  const previousFilters = useMemo(() => {
    if (!filters.dateRange) return { ...filters, dateRange: null };
    
    const duration = filters.dateRange.end.getTime() - filters.dateRange.start.getTime();
    return {
      ...filters,
      dateRange: {
        start: new Date(filters.dateRange.start.getTime() - duration),
        end: new Date(filters.dateRange.end.getTime() - duration),
      },
    };
  }, [filters]);

  const previous = useKpiFinancieros(claims, previousFilters);

  return { current, previous };
}
