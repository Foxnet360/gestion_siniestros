import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SlaTrackingService } from '../SlaTrackingService';
import type { ExtractedDates } from '../../types/sla-kpi';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      upsert: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  },
}));

describe('SlaTrackingService', () => {
  const service = new SlaTrackingService();

  describe('extractDateFromObservation', () => {
    it('should extract date with keyword and colon separator', () => {
      const text = 'LIQUIDACIÓN: 15/03/2024';
      const keywords = ['LIQUIDACIÓN'];

      const result = (service as any).extractDateFromObservation(text, keywords);

      expect(result).toBe('2024-03-15');
    });

    it('should extract date with keyword and space separator', () => {
      const text = 'AJUSTADOR 10/01/2024';
      const keywords = ['AJUSTADOR'];

      const result = (service as any).extractDateFromObservation(text, keywords);

      expect(result).toBe('2024-01-10');
    });

    it('should handle case-insensitive search', () => {
      const text = 'liquidación: 20/05/2024';
      const keywords = ['LIQUIDACIÓN'];

      const result = (service as any).extractDateFromObservation(text, keywords);

      expect(result).toBe('2024-05-20');
    });

    it('should return null when keyword not found', () => {
      const text = 'Some random observation without keywords';
      const keywords = ['LIQUIDACIÓN'];

      const result = (service as any).extractDateFromObservation(text, keywords);

      expect(result).toBeNull();
    });

    it('should return null when date format is invalid', () => {
      const text = 'LIQUIDACIÓN: invalid-date';
      const keywords = ['LIQUIDACIÓN'];

      const result = (service as any).extractDateFromObservation(text, keywords);

      expect(result).toBeNull();
    });
  });

  describe('normalizeDate', () => {
    it('should normalize DD/MM/YYYY format', () => {
      const result = (service as any).normalizeDate('', '15', '03', '2024');

      expect(result).toBe('2024-03-15');
    });

    it('should normalize YYYY-MM-DD format', () => {
      const result = (service as any).normalizeDate('', '2024', '03', '15');

      expect(result).toBe('2024-03-15');
    });

    it('should handle 2-digit years', () => {
      const result = (service as any).normalizeDate('', '15', '03', '24');

      expect(result).toBe('2024-03-15');
    });

    it('should return null for invalid dates', () => {
      const result = (service as any).normalizeDate('', '32', '13', '2024');

      expect(result).toBeNull();
    });
  });

  describe('validateDate', () => {
    it('should validate future dates as invalid', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const result = (service as any).validateDate(futureDate.toISOString().split('T')[0]);

      expect(result).toBe(false);
    });

    it('should validate past dates as valid', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const result = (service as any).validateDate(pastDate.toISOString().split('T')[0]);

      expect(result).toBe(true);
    });

    it('should validate dates before claim start as invalid', () => {
      const claimDate = '2024-03-01';
      const stageDate = '2024-02-15';

      const result = (service as any).validateDate(stageDate, claimDate);

      expect(result).toBe(false);
    });
  });

  describe('getEmptyDates', () => {
    it('should return object with 16 null dates', () => {
      const result = (service as any).getEmptyDates();

      expect(Object.keys(result)).toHaveLength(16);
      Object.values(result).forEach(value => {
        expect(value).toBeNull();
      });
    });
  });

  describe('STAGE_KEYWORDS', () => {
    it('should have keywords for all 14 stages (3-16)', () => {
      const keywords = (SlaTrackingService as any).STAGE_KEYWORDS;

      expect(Object.keys(keywords)).toHaveLength(14);

      for (let i = 3; i <= 16; i++) {
        expect(keywords[i]).toBeDefined();
        expect(Array.isArray(keywords[i])).toBe(true);
        expect(keywords[i].length).toBeGreaterThan(0);
      }
    });

    it('should include common keywords for stage 6 (Liquidación)', () => {
      const keywords = (SlaTrackingService as any).STAGE_KEYWORDS[6];

      expect(keywords).toContain('LIQUIDACIÓN');
      expect(keywords).toContain('LIQUIDACION');
    });

    it('should include common keywords for stage 10 (Desistimiento)', () => {
      const keywords = (SlaTrackingService as any).STAGE_KEYWORDS[10];

      expect(keywords).toContain('DESISTIMIENTO');
    });
  });
});
