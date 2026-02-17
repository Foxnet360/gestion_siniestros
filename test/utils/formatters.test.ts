import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercentage,
  truncateText,
  capitalize,
} from '../../utils/formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('formatea COP correctamente', () => {
      expect(formatCurrency(15000000)).toContain('$');
      expect(formatCurrency(15000000)).toContain('15.000.000');
    });

    it('maneja cero', () => {
      expect(formatCurrency(0)).toContain('$');
    });

    it('maneja valores negativos', () => {
      const result = formatCurrency(-1000);
      expect(result).toContain('-');
    });
  });

  describe('formatDate', () => {
    it('formatea fecha correctamente', () => {
      const date = new Date('2024-12-25');
      const result = formatDate(date);
      expect(result).toContain('25');
      expect(result).toContain('12');
      expect(result).toContain('2024');
    });

    it('formatea string ISO', () => {
      const result = formatDate('2024-12-25T00:00:00Z');
      expect(result).toContain('25');
    });

    it('retorna mensaje de error para fecha inválida', () => {
      expect(formatDate('invalid')).toBe('Fecha inválida');
    });
  });

  describe('formatDateTime', () => {
    it('incluye hora en el formato', () => {
      const date = new Date('2024-12-25T14:30:00');
      const result = formatDateTime(date);
      expect(result).toContain('14');
      expect(result).toContain('30');
    });
  });

  describe('formatNumber', () => {
    it('agrega separadores de miles', () => {
      expect(formatNumber(1500000)).toBe('1.500.000');
    });
  });

  describe('formatPercentage', () => {
    it('formatea decimal a porcentaje', () => {
      expect(formatPercentage(0.85)).toBe('85.0%');
    });

    it('respeta decimales personalizados', () => {
      expect(formatPercentage(0.8567, 2)).toBe('85.67%');
    });
  });

  describe('truncateText', () => {
    it('no trunca texto corto', () => {
      const text = 'Corto';
      expect(truncateText(text, 10)).toBe(text);
    });

    it('trunca texto largo', () => {
      const text = 'Este es un texto muy largo que debe ser truncado';
      expect(truncateText(text, 20)).toBe('Este es un texto muy...');
    });
  });

  describe('capitalize', () => {
    it('capitaliza primera letra', () => {
      expect(capitalize('hola')).toBe('Hola');
    });

    it('maneja string vacío', () => {
      expect(capitalize('')).toBe('');
    });
  });
});
