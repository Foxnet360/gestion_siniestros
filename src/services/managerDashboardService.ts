import { supabase } from '../lib/supabase';

export interface ProfitabilityMetrics {
  aseguradora: string;
  totalReclamado: number;
  totalIndemnizado: number;
  diferencia: number;
  porcentajeRecuperacion: number;
}

export interface TrendData {
  mes: string;
  casosNuevos: number;
  casosCerrados: number;
  montoReclamado: number;
  montoIndemnizado: number;
}

export interface ResolutionTimeMetrics {
  categoria: string;
  tiempoPromedioDias: number;
  casosTotales: number;
}

export interface ForecastData {
  mes: string;
  proyectado: number;
  actual?: number;
}

export interface ComparativeData {
  periodo: string;
  valorActual: number;
  valorAnterior: number;
  variacion: number;
}

/**
 * Obtiene métricas de rentabilidad por aseguradora
 */
export const getProfitabilityByAseguradora = async (
  startDate?: string,
  endDate?: string
): Promise<ProfitabilityMetrics[]> => {
  let query = supabase
    .from('claims')
    .select('aseguradora, monto_reclamo, valor_indemnizacion')
    .not('aseguradora', 'is', null);

  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching profitability:', error);
    throw new Error('No se pudieron cargar las métricas de rentabilidad');
  }

  // Agrupar por aseguradora
  const grouped = data?.reduce(
    (acc, claim) => {
      const aseguradora = claim.aseguradora || 'Sin Aseguradora';
      if (!acc[aseguradora]) {
        acc[aseguradora] = {
          aseguradora,
          totalReclamado: 0,
          totalIndemnizado: 0,
        };
      }
      acc[aseguradora].totalReclamado += Number(claim.monto_reclamo) || 0;
      acc[aseguradora].totalIndemnizado += Number(claim.valor_indemnizacion) || 0;
      return acc;
    },
    {} as Record<string, { aseguradora: string; totalReclamado: number; totalIndemnizado: number }>
  );

  return Object.values(grouped || {})
    .map(item => ({
      ...item,
      diferencia: item.totalReclamado - item.totalIndemnizado,
      porcentajeRecuperacion:
        item.totalReclamado > 0 ? (item.totalIndemnizado / item.totalReclamado) * 100 : 0,
    }))
    .sort((a, b) => b.totalReclamado - a.totalReclamado);
};

/**
 * Obtiene tendencias mensuales
 */
export const getMonthlyTrends = async (months: number = 12): Promise<TrendData[]> => {
  const { data, error } = await supabase
    .from('claims')
    .select('created_at, estado_interno, monto_reclamo, valor_indemnizacion')
    .gte('created_at', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    console.error('Error fetching trends:', error);
    throw new Error('No se pudieron cargar las tendencias');
  }

  // Agrupar por mes
  const grouped = data?.reduce(
    (acc, claim) => {
      const mes = new Date(claim.created_at).toLocaleString('es-CO', {
        month: 'short',
        year: 'numeric',
      });
      if (!acc[mes]) {
        acc[mes] = {
          mes,
          casosNuevos: 0,
          casosCerrados: 0,
          montoReclamado: 0,
          montoIndemnizado: 0,
        };
      }
      acc[mes].casosNuevos++;
      acc[mes].montoReclamado += Number(claim.monto_reclamo) || 0;
      if (claim.estado_interno === 'PAGADO' || claim.estado_interno === 'FINALIZADO') {
        acc[mes].casosCerrados++;
        acc[mes].montoIndemnizado += Number(claim.valor_indemnizacion) || 0;
      }
      return acc;
    },
    {} as Record<string, TrendData>
  );

  return Object.values(grouped || {}).reverse();
};

/**
 * Obtiene tiempos de resolución
 */
export const getResolutionTimes = async (): Promise<ResolutionTimeMetrics[]> => {
  const { data, error } = await supabase
    .from('state_history')
    .select('state, days_duration, claim_id');

  if (error) {
    console.error('Error fetching resolution times:', error);
    throw new Error('No se pudieron cargar los tiempos de resolución');
  }

  // Agrupar por estado
  const grouped = data?.reduce(
    (acc, history) => {
      const estado = history.state;
      if (!acc[estado]) {
        acc[estado] = {
          totalDias: 0,
          count: 0,
        };
      }
      acc[estado].totalDias += history.days_duration || 0;
      acc[estado].count++;
      return acc;
    },
    {} as Record<string, { totalDias: number; count: number }>
  );

  return Object.entries(grouped || {})
    .map(([categoria, data]) => ({
      categoria,
      tiempoPromedioDias: data.count > 0 ? Math.round(data.totalDias / data.count) : 0,
      casosTotales: data.count,
    }))
    .sort((a, b) => b.casosTotales - a.casosTotales);
};

/**
 * Obtiene proyecciones basadas en tendencias históricas
 */
export const getForecasts = async (months: number = 3): Promise<ForecastData[]> => {
  // Obtener datos históricos de los últimos 6 meses
  const { data, error } = await supabase
    .from('claims')
    .select('created_at, monto_reclamo')
    .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    console.error('Error fetching forecast data:', error);
    throw new Error('No se pudieron cargar las proyecciones');
  }

  // Agrupar por mes y calcular promedio
  const monthlyData = data?.reduce(
    (acc, claim) => {
      const mes = new Date(claim.created_at).toLocaleString('es-CO', {
        month: 'short',
        year: 'numeric',
      });
      if (!acc[mes]) {
        acc[mes] = { total: 0, count: 0 };
      }
      acc[mes].total += Number(claim.monto_reclamo) || 0;
      acc[mes].count++;
      return acc;
    },
    {} as Record<string, { total: number; count: number }>
  );

  const monthlyValues = Object.values(monthlyData || {}).map(m => m.total);
  const average =
    monthlyValues.length > 0 ? monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length : 0;

  // Generar proyecciones
  const forecasts: ForecastData[] = [];
  const now = new Date();

  for (let i = 1; i <= months; i++) {
    const fecha = new Date(now.getFullYear(), now.getMonth() + i, 1);
    forecasts.push({
      mes: fecha.toLocaleString('es-CO', { month: 'short', year: 'numeric' }),
      proyectado: Math.round(average * (1 + i * 0.02)), // Aumento del 2% mensual
    });
  }

  return forecasts;
};

/**
 * Obtiene datos comparativos año vs año
 */
export const getComparativeData = async (): Promise<ComparativeData[]> => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const lastYear = currentYear - 1;

  const { data, error } = await supabase.from('claims').select('created_at, monto_reclamo');

  if (error) {
    console.error('Error fetching comparative data:', error);
    throw new Error('No se pudieron cargar los datos comparativos');
  }

  // Agrupar por mes y año
  const grouped = data?.reduce(
    (acc, claim) => {
      const date = new Date(claim.created_at);
      const year = date.getFullYear();
      const month = date.toLocaleString('es-CO', { month: 'short' });

      if (year !== currentYear && year !== lastYear) return acc;

      const key = `${month}`;
      if (!acc[key]) {
        acc[key] = { [currentYear]: 0, [lastYear]: 0 };
      }
      acc[key][year] += Number(claim.monto_reclamo) || 0;
      return acc;
    },
    {} as Record<string, Record<number, number>>
  );

  return Object.entries(grouped || {}).map(([periodo, valores]) => ({
    periodo,
    valorActual: valores[currentYear] || 0,
    valorAnterior: valores[lastYear] || 0,
    variacion:
      valores[lastYear] > 0
        ? ((valores[currentYear] - valores[lastYear]) / valores[lastYear]) * 100
        : 0,
  }));
};

/**
 * Obtiene KPIs principales
 */
export const getMainKPIs = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const [currentMonthData, lastMonthData, totalData] = await Promise.all([
    supabase
      .from('claims')
      .select('monto_reclamo, valor_indemnizacion')
      .gte('created_at', startOfMonth),
    supabase
      .from('claims')
      .select('monto_reclamo, valor_indemnizacion')
      .gte('created_at', startOfLastMonth)
      .lt('created_at', startOfMonth),
    supabase.from('claims').select('estado_interno'),
  ]);

  const currentMonthReclamado =
    currentMonthData.data?.reduce((sum, c) => sum + (Number(c.monto_reclamo) || 0), 0) || 0;
  const currentMonthIndemnizado =
    currentMonthData.data?.reduce((sum, c) => sum + (Number(c.valor_indemnizacion) || 0), 0) || 0;

  const lastMonthReclamado =
    lastMonthData.data?.reduce((sum, c) => sum + (Number(c.monto_reclamo) || 0), 0) || 0;

  const casosActivos =
    totalData.data?.filter(c => !['FINALIZADO', 'PAGADO'].includes(c.estado_interno)).length || 0;

  const variacion =
    lastMonthReclamado > 0
      ? ((currentMonthReclamado - lastMonthReclamado) / lastMonthReclamado) * 100
      : 0;

  return {
    reclamadoMes: currentMonthReclamado,
    indemnizadoMes: currentMonthIndemnizado,
    casosActivos,
    variacionMes: variacion,
  };
};
