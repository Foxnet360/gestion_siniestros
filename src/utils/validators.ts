/**
 * Utilidades de sanitización y validación de datos
 */

/**
 * Sanitiza un string para prevenir XSS básico
 * @param value - Valor a sanitizar
 * @returns String sanitizado
 */
export const sanitizeString = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[<>]/g, '');
};

/**
 * Valida si un string es una fecha válida en formato ISO
 * @param dateString - String a validar
 * @returns boolean
 */
export const isValidISODate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Valida si un número es positivo
 * @param value - Valor a validar
 * @returns boolean
 */
export const isPositiveNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value) && value >= 0;
};

/**
 * Sanitiza y valida un valor monetario
 * @param value - Valor a sanitizar
 * @returns número válido o 0
 */
export const sanitizeCurrency = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]+/g, '');
    const num = Number(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

/**
 * Valida que un objeto tenga todas las propiedades requeridas
 * @param obj - Objeto a validar
 * @param requiredFields - Array de campos requeridos
 * @returns true si tiene todos los campos
 */
export const hasRequiredFields = <T extends Record<string, unknown>>(
  obj: T,
  requiredFields: (keyof T)[]
): boolean => {
  return requiredFields.every(field => {
    const value = obj[field];
    return value !== undefined && value !== null && value !== '';
  });
};
