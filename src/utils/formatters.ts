/**
 * Utilidades de formateo para moneda, fechas y otros valores
 */

/**
 * Formatea un número como moneda COP (Peso Colombiano)
 * @param value - Valor numérico a formatear
 * @param options - Opciones adicionales de Intl.NumberFormat
 * @returns String formateado (ej: "$ 15.000.000")
 */
export const formatCurrency = (value: number, options: Intl.NumberFormatOptions = {}): string => {
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    ...options,
  };

  return new Intl.NumberFormat('es-CO', defaultOptions).format(value);
};

/**
 * Formatea una fecha a formato local español
 * @param date - Fecha como string ISO o Date object
 * @param options - Opciones de Intl.DateTimeFormat
 * @returns String formateado (ej: "13/02/2026")
 */
export const formatDate = (
  date: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {}
): string => {
  if (!date) return '-';

  let dateObj: Date;

  if (typeof date === 'string') {
    // Si la fecha viene en formato YYYY-MM-DD (sin hora), interpretarla como fecha local
    // para evitar problemas de zona horaria que restan un día
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-').map(Number);
      dateObj = new Date(year, month - 1, day);
    }
    // Si la fecha viene con timezone UTC (ej: "2023-09-13 00:00:00+00" o "2023-09-13T00:00:00Z")
    // extraer solo la parte de la fecha y tratarla como fecha local
    else if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?([+-]\d{2}:?\d{2}|Z)$/.test(date)) {
      // Extraer YYYY-MM-DD de la fecha
      const datePart = date.substring(0, 10);
      const [year, month, day] = datePart.split('-').map(Number);
      dateObj = new Date(year, month - 1, day);
    } else {
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }

  if (isNaN(dateObj.getTime())) {
    return 'Fecha inválida';
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  };

  return new Intl.DateTimeFormat('es-CO', defaultOptions).format(dateObj);
};

/**
 * Formatea una fecha con hora
 * @param date - Fecha como string ISO o Date object
 * @returns String formateado (ej: "13/02/2026, 14:30")
 */
export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formatea un número con separadores de miles
 * @param value - Valor numérico
 * @returns String formateado (ej: "15.000.000")
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('es-CO').format(value);
};

/**
 * Formatea un porcentaje
 * @param value - Valor decimal (ej: 0.85 para 85%)
 * @param decimals - Número de decimales (default: 1)
 * @returns String formateado (ej: "85.0%")
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Trunca un texto si excede la longitud máxima
 * @param text - Texto a truncar
 * @param maxLength - Longitud máxima (default: 50)
 * @returns Texto truncado con "..." si aplica
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength - 3)}...`;
};

/**
 * Capitaliza la primera letra de un texto
 * @param text - Texto a capitalizar
 * @returns Texto capitalizado
 */
export const capitalize = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};
