import { describe, it, expect } from 'vitest';
import { KpiService } from '../KpiService';
import { calculateBusinessDays } from '../../utils/dateUtils';

describe('KpiService', () => {
  const service = new KpiService();

  describe('calculateBusinessDays', () => {
    it('should calculate business days excluding weekends', () => {
      // Monday to Friday = 5 business days
      const result = calculateBusinessDays('2024-03-04', '2024-03-08');
      expect(result).toBe(5);
    });

    it('should handle weeks with weekends', () => {
      // Friday to Monday = 2 business days (skips weekend)
      const result = calculateBusinessDays('2024-03-08', '2024-03-11');
      expect(result).toBe(2);
    });

    it('should return 0 for same day', () => {
      // Fixed to return 1 if it's a business day
      const result = calculateBusinessDays('2024-03-04', '2024-03-04');
      expect(result).toBe(1);
    });

    it('should handle multiple weeks', () => {
      // 2 weeks = 10 business days
      const result = calculateBusinessDays('2024-03-04', '2024-03-15');
      expect(result).toBe(10);
    });
  });

  describe('calculatePercentile', () => {
    it('should calculate 50th percentile correctly', () => {
      const sortedArray = [10, 20, 30, 40, 50];
      const result = (service as any).calculatePercentile(sortedArray, 50);
      expect(result).toBe(30);
    });

    it('should calculate 90th percentile', () => {
      const sortedArray = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const result = (service as any).calculatePercentile(sortedArray, 90);
      expect(result).toBe(90);
    });

    it('should handle array with one element', () => {
      const sortedArray = [42];
      const result = (service as any).calculatePercentile(sortedArray, 50);
      expect(result).toBe(42);
    });

    it('should handle 0th percentile', () => {
      const sortedArray = [10, 20, 30];
      const result = (service as any).calculatePercentile(sortedArray, 0);
      expect(result).toBe(10);
    });
  });

  describe('calculateBacklogByAge', () => {
    it('should group claims by age ranges correctly', () => {
      const today = new Date();
      const activeClaims = [
        { etapa_1_fecha: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString() }, // 15 days
        { etapa_1_fecha: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString() }, // 45 days
        { etapa_1_fecha: new Date(today.getTime() - 75 * 24 * 60 * 60 * 1000).toISOString() }, // 75 days
        { etapa_1_fecha: new Date(today.getTime() - 100 * 24 * 60 * 60 * 1000).toISOString() }, // 100 days
      ];

      const result = (service as any).calculateBacklogByAge(activeClaims);

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ range: '0-30 días', count: 1 });
      expect(result[1]).toEqual({ range: '31-60 días', count: 1 });
      expect(result[2]).toEqual({ range: '61-90 días', count: 1 });
      expect(result[3]).toEqual({ range: '90+ días', count: 1 });
    });

    it('should handle empty array', () => {
      const result = (service as any).calculateBacklogByAge([]);
      expect(result).toHaveLength(4);
      expect(result.every((r: any) => r.count === 0)).toBe(true);
    });

    it('should handle claims without etapa_1_fecha', () => {
      const activeClaims = [{ etapa_1_fecha: null }, { etapa_1_fecha: new Date().toISOString() }];

      const result = (service as any).calculateBacklogByAge(activeClaims);
      expect(result[0].count).toBe(1);
    });
  });

  describe('calculateBacklogByStage', () => {
    it('should determine current stage correctly', () => {
      const activeClaims = [
        { etapa_1_fecha: '2024-01-01', etapa_2_fecha: '2024-01-02', etapa_3_fecha: null },
        { etapa_1_fecha: '2024-01-01', etapa_2_fecha: null },
        {
          etapa_1_fecha: '2024-01-01',
          etapa_2_fecha: '2024-01-02',
          etapa_3_fecha: '2024-01-03',
          etapa_4_fecha: null,
        },
      ];

      const result = (service as any).calculateBacklogByStage(activeClaims);

      expect(result).toContainEqual({ stage: 2, count: 1 });
      expect(result).toContainEqual({ stage: 1, count: 1 });
      expect(result).toContainEqual({ stage: 3, count: 1 });
    });

    it('should handle claims with no stages', () => {
      const activeClaims = [{ etapa_1_fecha: null }];

      const result = (service as any).calculateBacklogByStage(activeClaims);
      expect(result.every((r: any) => r.count === 0)).toBe(true);
    });
  });
});
