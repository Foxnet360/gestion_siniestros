import { useMemo } from 'react';
import type { Claim } from '../types';

/**
 * Hook para obtener opciones únicas de filtros de forma memoizada
 * Evita recalcular en cada render cuando los claims no cambian
 * @param claims - Lista de reclamos
 * @returns Objeto con arrays de opciones únicas para cada filtro
 */
export const useFilterOptions = (claims: Claim[]) => {
  return useMemo(() => {
    const uniqueValues = <T extends string | number | boolean>(
      items: (T | null | undefined)[]
    ): T[] => {
      return Array.from(new Set(items.filter((x): x is T => x != null))).sort();
    };

    return {
      ramos: uniqueValues(claims.map(c => c.ramo)),
      aseguradoras: uniqueValues(claims.map(c => c.aseguradora)),
      estados: uniqueValues(claims.map(c => c.estado_interno)),
      tecnicos: uniqueValues(claims.map(c => c.tecnico_asignado)),
      aliados: uniqueValues(claims.map(c => c.aliado_origen)),
      vendedores: uniqueValues(claims.map(c => c.vendedor)),
    };
  }, [claims]);
};

/**
 * Hook para calcular KPIs de forma memoizada
 * @param claims - Lista de reclamos
 * @returns Objeto con métricas calculadas
 */
export const useKpiData = (claims: Claim[]) => {
  return useMemo(() => {
    // Total reclamado de casos activos
    const totalReclamado = claims.reduce((acc, curr) => {
      if (curr.estado_interno !== 'PAGADO' && curr.estado_interno !== 'FINALIZADO') {
        return acc + curr.monto_reclamo;
      }
      return acc;
    }, 0);

    // Tasa de éxito
    const closedClaims = claims.filter(
      c => c.estado_interno === 'PAGADO' || c.estado_interno === 'FINALIZADO'
    );
    const successClaims = closedClaims.filter(c => c.valor_indemnizacion > 0);
    const tasaExito =
      closedClaims.length > 0
        ? (successClaims.length / closedClaims.length) * 100
        : 0;

    // Casos quietos (> 30 días)
    const today = new Date();
    const casosQuietos = claims.filter(c => {
      const lastChange = c.lastStateChangeDate
        ? new Date(c.lastStateChangeDate)
        : new Date(c.updatedAt);
      const diffTime = Math.abs(today.getTime() - lastChange.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return (
        diffDays > 30 &&
        c.estado_interno !== 'PAGADO' &&
        c.estado_interno !== 'FINALIZADO'
      );
    }).length;

    return {
      totalReclamado,
      tasaExito,
      casosQuietos,
      totalClaims: claims.length,
      activeClaims: claims.filter(
        c => c.estado_interno !== 'PAGADO' && c.estado_interno !== 'FINALIZADO'
      ).length,
      closedClaimsCount: closedClaims.length,
    };
  }, [claims]);
};

/**
 * Hook para agrupar claims por una clave específica
 * @param claims - Lista de reclamos
 * @param key - Clave por la cual agrupar
 * @returns Array de tuplas [valor, claims[]] ordenado por cantidad
 */
export const useGroupedClaims = <K extends keyof Claim>(
  claims: Claim[],
  key: K
) => {
  return useMemo(() => {
    const grouped: Record<string, Claim[]> = {};

    claims.forEach(claim => {
      const val = String(claim[key] ?? 'Sin asignar');
      if (!grouped[val]) grouped[val] = [];
      grouped[val].push(claim);
    });

    return Object.entries(grouped).sort((a, b) => b[1].length - a[1].length
    );
  }, [claims, key]);
};
