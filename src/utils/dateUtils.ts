/**
 * ============================================================================
 * FERIADOS COLOMBIA (Hardcoded para años comunes)
 * ============================================================================
 */

export const FERIADOS_2024 = [
  '2024-01-01',
  '2024-01-08',
  '2024-03-25',
  '2024-03-28',
  '2024-03-29',
  '2024-05-01',
  '2024-05-13',
  '2024-06-03',
  '2024-06-10',
  '2024-07-01',
  '2024-07-20',
  '2024-08-07',
  '2024-08-19',
  '2024-10-14',
  '2024-11-04',
  '2024-11-11',
  '2024-12-08',
  '2024-12-25',
];

export const FERIADOS_2025 = [
  '2025-01-01',
  '2025-01-06',
  '2025-03-24',
  '2025-04-17',
  '2025-04-18',
  '2025-05-01',
  '2025-06-02',
  '2025-06-23',
  '2025-06-30',
  '2025-07-20',
  '2025-08-07',
  '2025-08-18',
  '2025-10-13',
  '2025-11-03',
  '2025-11-17',
  '2025-12-08',
  '2025-12-25',
];

export const FERIADOS_COLOMBIA_SET = new Set([...FERIADOS_2024, ...FERIADOS_2025]);

/**
 * Verifica si una fecha es día hábil (no fin de semana ni feriado en Colombia)
 */
export const isBusinessDay = (date: Date): boolean => {
  const dayOfWeek = date.getDay();

  // 0 = Domingo, 6 = Sábado
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }

  // Verificar si es feriado
  const dateString = date.toISOString().split('T')[0];
  return !FERIADOS_COLOMBIA_SET.has(dateString);
};

/**
 * Calcula días hábiles entre dos fechas (excluyendo fines de semana y feriados colombianos)
 */
export const calculateBusinessDays = (startDate: string | Date | null | undefined, endDate: string | Date | null | undefined): number => {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Handling invalid dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0;
  }

  // Si es la misma fecha exacta, retornar 1 si es día hábil
  if (start.toDateString() === end.toDateString()) {
    return isBusinessDay(start) ? 1 : 0;
  }

  // Swap dates if start is strictly after end to get a positive count or return 0
  // Here we just return 0 if end < start for standard SLA metrics
  if (start > end) {
      return 0;
  }

  let businessDays = 0;
  const current = new Date(start);

  while (current <= end) {
    if (isBusinessDay(current)) {
      businessDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  return businessDays;
};
