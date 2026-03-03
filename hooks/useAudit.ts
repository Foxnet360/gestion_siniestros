import { useState, useEffect, useCallback } from 'react';
import {
  AuditFilters,
  AuditLogEntry,
  getAuditLogs,
  getUserActivity,
  exportAuditLogsToCSV,
} from '../services/auditService';

interface UseAuditReturn {
  logs: AuditLogEntry[];
  total: number;
  isLoading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  fetchLogs: (filters?: AuditFilters, page?: number, pageSize?: number) => Promise<void>;
  fetchUserActivity: (userId: string, limit?: number) => Promise<void>;
  exportToCSV: (filters?: AuditFilters) => Promise<string>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

export const useAudit = (): UseAuditReturn => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState(50);

  const fetchLogs = useCallback(
    async (
      filters?: AuditFilters,
      targetPage: number = page,
      targetPageSize: number = pageSize
    ) => {
      try {
        setIsLoading(true);
        setError(null);
        const { logs: data, total: count } = await getAuditLogs(
          filters,
          targetPage,
          targetPageSize
        );
        setLogs(data);
        setTotal(count);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar logs de auditoría');
      } finally {
        setIsLoading(false);
      }
    },
    [page, pageSize]
  );

  const fetchUserActivity = useCallback(async (userId: string, limit: number = 20) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getUserActivity(userId, limit);
      setLogs(data);
      setTotal(data.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar actividad del usuario');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exportToCSV = useCallback(async (filters?: AuditFilters): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);
      return await exportAuditLogsToCSV(filters);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al exportar logs';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setPage = useCallback((newPage: number) => {
    setPageState(newPage);
  }, []);

  const setPageSize = useCallback((newSize: number) => {
    setPageSizeState(newSize);
    setPageState(1); // Reset to first page when changing page size
  }, []);

  // Refetch when page or pageSize changes
  useEffect(() => {
    fetchLogs(undefined, page, pageSize);
  }, [page, pageSize, fetchLogs]);

  return {
    logs,
    total,
    isLoading,
    error,
    page,
    pageSize,
    fetchLogs,
    fetchUserActivity,
    exportToCSV,
    setPage,
    setPageSize,
  };
};

export default useAudit;
