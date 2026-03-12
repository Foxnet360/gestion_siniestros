import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateNextFollowUp,
  getFollowUpRules,
  getMaxDaysForState,
  getMinDaysForState,
  validateFollowUpDate,
  FollowUpRules,
} from '../followUpCalculationService';
import { Claim, InternalState, Priority } from '../../types';
import { supabase } from '../../lib/supabase';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

describe('FollowUpCalculationService', () => {
  const mockClaim = (state: InternalState, overrides: Partial<Claim> = {}): Claim => ({
    id_softseguros: 'TEST-001',
    numero_siniestro: 'SIN-TEST-001',
    poliza: 'POL-001',
    asegurado: 'Test Client',
    estado_softseguros: 'ABIERTO',
    usuario_registro: 'test_user',
    ultimo_seguimiento_raw: '',
    placa_bien: 'ABC-123',
    ramo: 'Automóviles',
    aseguradora: 'Test Insurance',
    vendedor: 'Test Seller',
    id_interno: 'INT-001',
    estado_interno: state,
    lastStateChangeDate: new Date().toISOString(),
    stateHistory: [],
    tecnico_asignado: 'Test Technician',
    prioridad: Priority.MEDIA,
    monto_reclamo: 1000000,
    valor_deducible: 100000,
    valor_indemnizacion: 0,
    updatedAt: new Date().toISOString(),
    timeline: [],
    ...overrides,
  });

  describe('getFollowUpRules', () => {
    it('should return rules from database when available', async () => {
      const mockRules: FollowUpRules = {
        standard: { phases: [1, 2, 3, 4, 5], days: 10, description: 'Test' },
        legal: {
          state: 'PROCESO JURÍDICO',
          minDays: 30,
          maxDays: 60,
          defaultDays: 30,
          description: 'Test',
        },
        prescription: { state: 'PRESCRIPCIÓN', days: 10, description: 'Test' },
      };

      const mockSingle = vi
        .fn()
        .mockResolvedValue({ data: { config_value: mockRules }, error: null });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const rules = await getFollowUpRules();

      expect(rules).toEqual(mockRules);
    });

    it('should return default rules when database fails', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const rules = await getFollowUpRules();

      expect(rules.standard.days).toBe(10);
      expect(rules.legal.defaultDays).toBe(30);
    });
  });

  describe('calculateNextFollowUp', () => {
    it('should calculate 10 days for standard phases (Fase 1-5)', async () => {
      const claim = mockClaim('AVISO SINIESTRO');
      const today = new Date('2026-03-06');

      const result = await calculateNextFollowUp(claim, today);

      const expected = new Date('2026-03-16'); // 10 days later
      expect(result.toISOString().split('T')[0]).toBe(expected.toISOString().split('T')[0]);
    });

    it('should calculate 30 days for PROCESO JURÍDICO', async () => {
      const claim = mockClaim('PROCESO JURÍDICO');
      const today = new Date('2026-03-06');

      const result = await calculateNextFollowUp(claim, today);

      const expected = new Date('2026-04-05'); // 30 days later
      expect(result.toISOString().split('T')[0]).toBe(expected.toISOString().split('T')[0]);
    });

    it('should calculate 10 days for PRESCRIPCIÓN state', async () => {
      const claim = mockClaim('PRESCRIPCIÓN');
      const today = new Date('2026-03-06');

      const result = await calculateNextFollowUp(claim, today);

      const expected = new Date('2026-03-16'); // 10 days later
      expect(result.toISOString().split('T')[0]).toBe(expected.toISOString().split('T')[0]);
    });

    it('should prioritize prescription date when claim has critical alert', async () => {
      const prescriptionDate = new Date('2026-03-12'); // 6 days from today
      const claim = mockClaim('LIQUIDACIÓN', {
        alert_level: 'critical',
        fecha_prescripcion_ordinaria: prescriptionDate.toISOString(),
      });
      const today = new Date('2026-03-06');

      const result = await calculateNextFollowUp(claim, today);

      // Should suggest 1 day before prescription (or minimum 1 day)
      expect(result.getTime()).toBeLessThan(prescriptionDate.getTime());
    });

    it('should handle all states in Fase 1 correctly', async () => {
      const fase1States: InternalState[] = [
        'AVISO SINIESTRO',
        'OBTENCIÓN SOPORTES',
        'ESTUDIO TÉCNICO CORREDORES',
      ];
      const today = new Date('2026-03-06');

      for (const state of fase1States) {
        const claim = mockClaim(state);
        const result = await calculateNextFollowUp(claim, today);
        const expected = new Date('2026-03-16');
        expect(result.toISOString().split('T')[0]).toBe(expected.toISOString().split('T')[0]);
      }
    });

    it('should handle all states in Fase 2 correctly', async () => {
      const fase2States: InternalState[] = [
        'RADICACIÓN COMPAÑÍA',
        'AJUSTADOR',
        'DOCUMENTOS ADICIONALES',
      ];
      const today = new Date('2026-03-06');

      for (const state of fase2States) {
        const claim = mockClaim(state);
        const result = await calculateNextFollowUp(claim, today);
        const expected = new Date('2026-03-16');
        expect(result.toISOString().split('T')[0]).toBe(expected.toISOString().split('T')[0]);
      }
    });

    it('should handle all states in Fase 3 correctly', async () => {
      const fase3States: InternalState[] = [
        'DOCUMENTOS COMPLETOS',
        'DEVOLUCIÓN DE DOCUMENTOS',
        'LIQUIDACIÓN',
        'OBJECIÓN',
      ];
      const today = new Date('2026-03-06');

      for (const state of fase3States) {
        const claim = mockClaim(state);
        const result = await calculateNextFollowUp(claim, today);
        const expected = new Date('2026-03-16');
        expect(result.toISOString().split('T')[0]).toBe(expected.toISOString().split('T')[0]);
      }
    });
  });

  describe('getMaxDaysForState', () => {
    it('should return 60 for PROCESO JURÍDICO', async () => {
      const maxDays = await getMaxDaysForState('PROCESO JURÍDICO');
      expect(maxDays).toBe(60);
    });

    it('should return null for standard phases', async () => {
      const maxDays = await getMaxDaysForState('LIQUIDACIÓN');
      expect(maxDays).toBeNull();
    });
  });

  describe('getMinDaysForState', () => {
    it('should return 30 for PROCESO JURÍDICO', async () => {
      const minDays = await getMinDaysForState('PROCESO JURÍDICO');
      expect(minDays).toBe(30);
    });

    it('should return 1 for standard phases', async () => {
      const minDays = await getMinDaysForState('LIQUIDACIÓN');
      expect(minDays).toBe(1);
    });
  });

  describe('validateFollowUpDate', () => {
    it('should validate date within legal process range', async () => {
      const today = new Date('2026-03-06');
      const validDate = new Date('2026-04-05'); // 30 days - valid

      const result = await validateFollowUpDate('PROCESO JURÍDICO', validDate, today);

      expect(result.valid).toBe(true);
    });

    it('should reject date below minimum for legal process', async () => {
      const today = new Date('2026-03-06');
      const invalidDate = new Date('2026-03-10'); // 4 days - invalid

      const result = await validateFollowUpDate('PROCESO JURÍDICO', invalidDate, today);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('al menos 30 días');
    });

    it('should reject date above maximum for legal process', async () => {
      const today = new Date('2026-03-06');
      const invalidDate = new Date('2026-06-06'); // 92 days - invalid

      const result = await validateFollowUpDate('PROCESO JURÍDICO', invalidDate, today);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('no puede exceder 60 días');
    });
  });

  describe('Edge Cases', () => {
    it('should handle claim in FINALIZADO state', async () => {
      const claim = mockClaim('FINALIZADO');
      const today = new Date('2026-03-06');

      const result = await calculateNextFollowUp(claim, today);

      // Should still return a date (10 days default)
      expect(result.getTime()).toBeGreaterThan(today.getTime());
    });

    it('should handle claim without fecha_ocurrencia', async () => {
      const claim = mockClaim('LIQUIDACIÓN', { fecha_ocurrencia: undefined });
      const today = new Date('2026-03-06');

      const result = await calculateNextFollowUp(claim, today);

      // Should still calculate follow-up date
      expect(result.getTime()).toBeGreaterThan(today.getTime());
    });

    it('should handle missing database configuration gracefully', async () => {
      const mockSingle = vi.fn().mockRejectedValue(new Error('Network error'));
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const claim = mockClaim('LIQUIDACIÓN');
      const today = new Date('2026-03-06');

      // Should not throw, use defaults
      const result = await calculateNextFollowUp(claim, today);
      expect(result.getTime()).toBeGreaterThan(today.getTime());
    });
  });
});
