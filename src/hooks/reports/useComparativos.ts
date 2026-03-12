import { useMemo } from 'react';
import type { Claim } from '../../types';
import type { ComparativoPeriodo, ComparativoAseguradora, ComparativoRamo, ComparativoHistorico } from '../../types/reports';

interface ComparativosData {
  mesVsMes: { actual: ComparativoPeriodo; anterior: ComparativoPeriodo } | null;
  anioVsAnio: { actual: ComparativoPeriodo; anterior: ComparativoPeriodo } | null;
  porAseguradora: ComparativoAseguradora[];
  porRamo: ComparativoRamo[];
  historicoMensual: ComparativoHistorico[];
}

export function useComparativos(claims: Claim[]): ComparativosData {
  return useMemo(() => {
    const now = new Date();

    // Helper to calculate metrics for a period
    const calcularMetricasPeriodo = (start: Date, end: Date): ComparativoPeriodo => {
      const periodClaims = claims.filter((c) => {
        const date = c.fecha_aviso ? new Date(c.fecha_aviso) : null;
        return date && date >= start && date <= end;
      });

      const totalReclamado = periodClaims.reduce((sum, c) => sum + (c.monto_reclamo || 0), 0);
      const finalizedClaims = periodClaims.filter((c) => c.finalizado);
      const totalIndemnizado = finalizedClaims.reduce((sum, c) => sum + (c.valor_indemnizacion || 0), 0);

      // Calculate average time
      const tiemposCierre = finalizedClaims
        .filter((c) => c.fecha_aviso && c.fecha_finalizacion)
        .map((c) => {
          const aviso = new Date(c.fecha_aviso!);
          const cierre = new Date(c.fecha_finalizacion!);
          return Math.floor((cierre.getTime() - aviso.getTime()) / (1000 * 60 * 60 * 24));
        });
      const tiempoPromedio = tiemposCierre.length > 0
        ? tiemposCierre.reduce((a, b) => a + b, 0) / tiemposCierre.length
        : 0;

      const conObjecion = periodClaims.filter((c) => c.estado_interno === 'OBJECIÓN').length;
      const porcentajeObjeciones = periodClaims.length > 0
        ? (conObjecion / periodClaims.length) * 100
        : 0;

      return {
        periodo: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
        totalReclamado,
        totalIndemnizado,
        casosCerrados: finalizedClaims.length,
        tiempoPromedio,
        porcentajeObjeciones,
        tasaCierreExitoso: periodClaims.length > 0 ? (finalizedClaims.length / periodClaims.length) * 100 : 0
      };
    };

    // Mes vs Mes
    const mesActualStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const mesActualEnd = now;
    const mesAnteriorStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const mesAnteriorEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const mesVsMes = {
      actual: calcularMetricasPeriodo(mesActualStart, mesActualEnd),
      anterior: calcularMetricasPeriodo(mesAnteriorStart, mesAnteriorEnd),
    };

    // Año vs Año
    const anioActualStart = new Date(now.getFullYear(), 0, 1);
    const anioActualEnd = now;
    const anioAnteriorStart = new Date(now.getFullYear() - 1, 0, 1);
    const anioAnteriorEnd = new Date(now.getFullYear() - 1, 11, 31);

    const anioVsAnio = {
      actual: calcularMetricasPeriodo(anioActualStart, anioActualEnd),
      anterior: calcularMetricasPeriodo(anioAnteriorStart, anioAnteriorEnd),
    };

    // Por Aseguradora
    const aseguradoraMap = new Map<string, Claim[]>();
    claims.forEach((c) => {
      const existing = aseguradoraMap.get(c.aseguradora) || [];
      existing.push(c);
      aseguradoraMap.set(c.aseguradora, existing);
    });

    const porAseguradora = Array.from(aseguradoraMap.entries()).map(([aseguradora, aseguradoraClaims]) => {
      const totalClaims = aseguradoraClaims.length;
      const conObjecion = aseguradoraClaims.filter((c) => c.estado_interno === 'OBJECIÓN').length;
      const porcentajeObjeciones = totalClaims > 0 ? (conObjecion / totalClaims) * 100 : 0;

      const finalizedClaims = aseguradoraClaims.filter((c) => c.finalizado);
      const tiemposCierre = finalizedClaims
        .filter((c) => c.fecha_aviso && c.fecha_finalizacion)
        .map((c) => {
          const aviso = new Date(c.fecha_aviso!);
          const cierre = new Date(c.fecha_finalizacion!);
          return Math.floor((cierre.getTime() - aviso.getTime()) / (1000 * 60 * 60 * 24));
        });
      const tiempoPromedio = tiemposCierre.length > 0
        ? tiemposCierre.reduce((a, b) => a + b, 0) / tiemposCierre.length
        : 0;

      // Calculate reconsideration success rate (simplified)
      const reconsideracionesExitosas = 0; // Would need additional data
      const tasaCierreExitoso = totalClaims > 0 ? (finalizedClaims.length / totalClaims) * 100 : 0;

      return {
        aseguradora,
        tiempoPromedio,
        porcentajeObjeciones,
        reconsideracionesExitosas,
        tasaCierreExitoso,
      };
    }).sort((a, b) => a.tiempoPromedio - b.tiempoPromedio);

    // Por Ramo
    const ramoMap = new Map<string, Claim[]>();
    claims.forEach((c) => {
      const existing = ramoMap.get(c.ramo) || [];
      existing.push(c);
      ramoMap.set(c.ramo, existing);
    });

    const porRamo = Array.from(ramoMap.entries()).map(([ramo, ramoClaims]) => {
      const totalClaims = ramoClaims.length;
      const conObjecion = ramoClaims.filter((c) => c.estado_interno === 'OBJECIÓN').length;
      const porcentajeObjeciones = totalClaims > 0 ? (conObjecion / totalClaims) * 100 : 0;

      const finalizedClaims = ramoClaims.filter((c) => c.finalizado);
      const tiemposCierre = finalizedClaims
        .filter((c) => c.fecha_aviso && c.fecha_finalizacion)
        .map((c) => {
          const aviso = new Date(c.fecha_aviso!);
          const cierre = new Date(c.fecha_finalizacion!);
          return Math.floor((cierre.getTime() - aviso.getTime()) / (1000 * 60 * 60 * 24));
        });
      const tiempoPromedio = tiemposCierre.length > 0
        ? tiemposCierre.reduce((a, b) => a + b, 0) / tiemposCierre.length
        : 0;

      const tasaCierreExitoso = totalClaims > 0 ? (finalizedClaims.length / totalClaims) * 100 : 0;

      return {
        ramo,
        tiempoPromedio,
        porcentajeObjeciones,
        tasaCierreExitoso,
      };
    }).sort((a, b) => a.tiempoPromedio - b.tiempoPromedio);

    // Histórico Últimos 12 meses
    const historicoMensual: ComparativoHistorico[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const metricas = calcularMetricasPeriodo(monthStart, monthEnd);
      historicoMensual.push({
        mes: monthStart.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
        reclamado: metricas.totalReclamado,
        indemnizado: metricas.totalIndemnizado,
        tiempoPromedio: metricas.tiempoPromedio
      });
    }

    return {
      mesVsMes,
      anioVsAnio,
      porAseguradora,
      porRamo,
      historicoMensual,
    };
  }, [claims]);
}
