import { useState, useCallback } from 'react';
import {
  UserFilters,
  getUsers,
  getUserById,
  getActiveTechnicians,
  getAllies,
  createUser,
  updateUser,
  deactivateUser,
  reactivateUser,
  CreateUserData,
  UpdateUserData,
} from '../services/userService';
import { User } from '../types';

interface UseUsersReturn {
  users: User[];
  technicians: User[];
  allies: { id: string; name: string }[];
  isLoading: boolean;
  error: string | null;
  // Pagination
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  fetchUsers: (filters?: UserFilters, targetPage?: number) => Promise<void>;
  fetchTechnicians: () => Promise<void>;
  fetchAllies: () => Promise<void>;
  createNewUser: (data: CreateUserData) => Promise<User>;
  updateExistingUser: (userId: string, data: UpdateUserData) => Promise<User>;
  deactivateExistingUser: (userId: string) => Promise<void>;
  reactivateExistingUser: (userId: string) => Promise<void>;
  getUser: (userId: string) => Promise<User | null>;
}

export const useUsers = (): UseUsersReturn => {
  const [users, setUsers] = useState<User[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [allies, setAllies] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchUsers = useCallback(
    async (filters?: UserFilters, targetPage?: number) => {
      try {
        setIsLoading(true);
        setError(null);
        const currentPage = targetPage || page;
        const result = await getUsers(filters, currentPage, pageSize);
        setUsers(result.users);
        setTotal(result.total);
        setTotalPages(result.totalPages);
        if (targetPage) {
          setPage(targetPage);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
      } finally {
        setIsLoading(false);
      }
    },
    [page, pageSize]
  );

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPage(1); // Reset to first page when changing page size
  }, []);

  const fetchTechnicians = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getActiveTechnicians();
      setTechnicians(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar técnicos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAllies = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllies();
      setAllies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar aliados');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNewUser = useCallback(async (data: CreateUserData): Promise<User> => {
    try {
      setIsLoading(true);
      setError(null);
      const newUser = await createUser(data);
      setUsers(prev => [...prev, newUser]);
      return newUser;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear usuario';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateExistingUser = useCallback(
    async (userId: string, data: UpdateUserData): Promise<User> => {
      try {
        setIsLoading(true);
        setError(null);
        const updatedUser = await updateUser(userId, data);
        setUsers(prev => prev.map(u => (u.id === userId ? updatedUser : u)));
        return updatedUser;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al actualizar usuario';
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deactivateExistingUser = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await deactivateUser(userId);
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, isActive: false } : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al desactivar usuario');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reactivateExistingUser = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await reactivateUser(userId);
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, isActive: true } : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reactivar usuario');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getUser = useCallback(async (userId: string): Promise<User | null> => {
    try {
      setIsLoading(true);
      setError(null);
      return await getUserById(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener usuario');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    users,
    technicians,
    allies,
    isLoading,
    error,
    // Pagination
    page,
    pageSize,
    total,
    totalPages,
    setPage,
    setPageSize,
    fetchUsers,
    fetchTechnicians,
    fetchAllies,
    createNewUser,
    updateExistingUser,
    deactivateExistingUser,
    reactivateExistingUser,
    getUser,
  };
};

export default useUsers;
