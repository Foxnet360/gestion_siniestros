import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculatePrescriptionDates,
  getApplicablePrescriptionDate,
  getPrescriptionAlertLevel,
  checkPrescriptionAlerts,
  requiresExtraordinaryPrescription,
  getPrescriptionYears,
  formatPrescriptionInfo,
} from '../prescriptionService';
import { Claim, InternalState, Priority } from '../../types';
import { supabase } from '../../lib/supabase';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        not: vi.fn(() => ({
          not: vi.fn(() => ({
            then: vi.fn(),
          })),
        })),
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          then: vi.fn(),
        })),
      })),
    })),
  },
}));

describe('PrescriptionService', () => {
  const mockClaim = (overrides: Partial<Claim> = {}): Claim => ({
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
    tecnico_asignado: 'Test Technician',
    id_interno: 'INT-001',
    estado_interno: 'LIQUIDACIÓN' as InternalState,
    lastStateChangeDate: new Date().toISOString(),
    stateHistory: [],
    prioridad: Priority.MEDIA,
    monto_reclamo: 1000000,
    valor_deducible: 100000,
    valor_indemnizacion: 0,
    fecha_ocurrencia: '2024-03-06', // 2 years ago
    updatedAt: new Date().toISOString(),
    timeline: [],
    ...overrides,
  });

  describe('calculatePrescriptionDates', () => {
    it('should calculate ordinary prescription (2 years) for non-RC ramos', () => {
      const claim = mockClaim({ ramo: 'Automóviles' });
      const dates = calculatePrescriptionDates(claim);

      expect(dates.ordinaria).toBeInstanceOf(Date);
      expect(dates.extraordinaria).toBeNull();
      expect(dates.applicable).toEqual(dates.ordinaria);

      // Should be 2 years after fecha_ocurrencia
      const expectedDate = new Date('2026-03-06');
      expect(dates.ordinaria?.toISOString().split('T')[0]).toBe(
        expectedDate.toISOString().split('T')[0]
      );
    });

    it('should calculate extraordinary prescription (5 years) for RC', () => {
      const claim = mockClaim({ ramo: 'Responsabilidad Civil' });
      const dates = calculatePrescriptionDates(claim);

      expect(dates.ordinaria).toBeInstanceOf(Date);
      expect(dates.extraordinaria).toBeInstanceOf(Date);
      expect(dates.applicable).toEqual(dates.extraordinaria);

      // Ordinaria should be 2 years
      expect(dates.ordinaria?.toISOString().split('T')[0]).toBe('2026-03-06');
      // Extraordinaria should be 5 years
      expect(dates.extraordinaria?.toISOString().split('T')[0]).toBe('2029-03-06');
    });

    it('should return null dates when fecha_ocurrencia is missing', () => {
      const claim = mockClaim({ fecha_ocurrencia: undefined });
      const dates = calculatePrescriptionDates(claim);

      expect(dates.ordinaria).toBeNull();
      expect(dates.extraordinaria).toBeNull();
      expect(dates.applicable).toBeNull();
    });

    it('should handle different ramos correctly', () => {
      const ramos = [
        { ramo: 'Automóviles', extraordinary: false },
        { ramo: 'Vida Grupo', extraordinary: false },
        { ramo: 'Hogar', extraordinary: false },
        { ramo: 'Responsabilidad Civil', extraordinary: true },
        { ramo: 'RC Profesional', extraordinary: true },
      ];

      ramos.forEach(({ ramo, extraordinary }) => {
        const claim = mockClaim({ ramo });
        const dates = calculatePrescriptionDates(claim);

        if (extraordinary) {
          expect(dates.extraordinaria).not.toBeNull();
          expect(dates.applicable).toEqual(dates.extraordinaria);
        } else {
          expect(dates.extraordinaria).toBeNull();
          expect(dates.applicable).toEqual(dates.ordinaria);
        }
      });
    });
  });

  describe('getApplicablePrescriptionDate', () => {
    it('should return extraordinaria for RC claims', () => {
      const claim = mockClaim({ ramo: 'Responsabilidad Civil' });
      const date = getApplicablePrescriptionDate(claim);

      expect(date?.toISOString().split('T')[0]).toBe('2029-03-06');
    });

    it('should return ordinaria for non-RC claims', () => {
      const claim = mockClaim({ ramo: 'Automóviles' });
      const date = getApplicablePrescriptionDate(claim);

      expect(date?.toISOString().split('T')[0]).toBe('2026-03-06');
    });

    it('should return null when fecha_ocurrencia is missing', () => {
      const claim = mockClaim({ fecha_ocurrencia: undefined });
      const date = getApplicablePrescriptionDate(claim);

      expect(date).toBeNull();
    });
  });

  describe('getPrescriptionAlertLevel', () => {
    it('should return "resolved" for finalized claims', async () => {
      const claim = mockClaim({
        estado_interno: 'FINALIZADO',
        alert_level: 'warning',
      });

      const level = await getPrescriptionAlertLevel(claim);
      expect(level).toBe('resolved');
    });

    it('should return "resolved" for paid claims', async () => {
      const claim = mockClaim({
        estado_interno: 'PAGADO',
        alert_level: 'critical',
      });

      const level = await getPrescriptionAlertLevel(claim);
      expect(level).toBe('resolved');
    });

    it('should return "critical" when prescription is expired', async () => {
      // Claim with fecha_ocurrencia 3 years ago (prescription expired 1 year ago)
      const claim = mockClaim({
        fecha_ocurrencia: '2021-03-06',
        ramo: 'Automóviles',
      });

      const level = await getPrescriptionAlertLevel(claim);
      expect(level).toBe('critical');
    });

    it('should return "critical" when within 30 days of prescription', async () => {
      // Claim with fecha_ocurrencia 1 year and 340 days ago (20 days remaining)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 20);
      const fechaOcurrencia = new Date(futureDate);
      fechaOcurrencia.setFullYear(fechaOcurrencia.getFullYear() - 2);

      const claim = mockClaim({
        fecha_ocurrencia: fechaOcurrencia.toISOString().split('T')[0],
        ramo: 'Automóviles',
      });

      const level = await getPrescriptionAlertLevel(claim);
      expect(level).toBe('critical');
    });

    it('should return "warning" when within 90 days of prescription', async () => {
      // Claim with fecha_ocurrencia 1 year and 280 days ago (80 days remaining)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 80);
      const fechaOcurrencia = new Date(futureDate);
      fechaOcurrencia.setFullYear(fechaOcurrencia.getFullYear() - 2);

      const claim = mockClaim({
        fecha_ocurrencia: fechaOcurrencia.toISOString().split('T')[0],
        ramo: 'Automóviles',
      });

      const level = await getPrescriptionAlertLevel(claim);
      expect(level).toBe('warning');
    });

    it('should return "normal" when more than 90 days from prescription', async () => {
      // Claim with fecha_ocurrencia 1 year ago (365 days remaining)
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const fechaOcurrencia = new Date(futureDate);
      fechaOcurrencia.setFullYear(fechaOcurrencia.getFullYear() - 2);

      const claim = mockClaim({
        fecha_ocurrencia: fechaOcurrencia.toISOString().split('T')[0],
        ramo: 'Automóviles',
      });

      const level = await getPrescriptionAlertLevel(claim);
      expect(level).toBe('normal');
    });
  });

  describe('requiresExtraordinaryPrescription', () => {
    it('should return true for "Responsabilidad Civil"', () => {
      expect(requiresExtraordinaryPrescription('Responsabilidad Civil')).toBe(true);
      expect(requiresExtraordinaryPrescription('responsabilidad civil')).toBe(true);
    });

    it('should return true for "RC Profesional"', () => {
      expect(requiresExtraordinaryPrescription('RC Profesional')).toBe(true);
    });

    it('should return false for other ramos', () => {
      expect(requiresExtraordinaryPrescription('Automóviles')).toBe(false);
      expect(requiresExtraordinaryPrescription('Vida Grupo')).toBe(false);
      expect(requiresExtraordinaryPrescription('Hogar')).toBe(false);
    });
  });

  describe('getPrescriptionYears', () => {
    it('should return 5 for RC', () => {
      expect(getPrescriptionYears('Responsabilidad Civil')).toBe(5);
    });

    it('should return 2 for other ramos', () => {
      expect(getPrescriptionYears('Automóviles')).toBe(2);
      expect(getPrescriptionYears('Vida')).toBe(2);
    });
  });

  describe('formatPrescriptionInfo', () => {
    it('should format info for non-RC claim correctly', () => {
      const claim = mockClaim({
        ramo: 'Automóviles',
        fecha_ocurrencia: '2025-01-01', // Future date so it won't expire soon
      });

      const info = formatPrescriptionInfo(claim);
      expect(info).toContain('Ordinaria');
      expect(info).toContain('2 años');
    });

    it('should format info for RC claim correctly', () => {
      const claim = mockClaim({
        ramo: 'Responsabilidad Civil',
        fecha_ocurrencia: '2025-01-01',
      });

      const info = formatPrescriptionInfo(claim);
      expect(info).toContain('Extraordinaria');
      expect(info).toContain('5 años');
    });

    it('should indicate missing fecha_ocurrencia', () => {
      const claim = mockClaim({ fecha_ocurrencia: undefined });

      const info = formatPrescriptionInfo(claim);
      expect(info).toContain('No calculada');
    });
  });

  describe('Edge Cases', () => {
    it('should handle case-insensitive ramo matching', () => {
      const claim1 = mockClaim({ ramo: 'RESPONSABILIDAD CIVIL' });
      const claim2 = mockClaim({ ramo: 'responsabilidad civil' });
      const claim3 = mockClaim({ ramo: 'Responsabilidad Civil' });

      const dates1 = calculatePrescriptionDates(claim1);
      const dates2 = calculatePrescriptionDates(claim2);
      const dates3 = calculatePrescriptionDates(claim3);

      expect(dates1.extraordinaria).not.toBeNull();
      expect(dates2.extraordinaria).not.toBeNull();
      expect(dates3.extraordinaria).not.toBeNull();
    });

    it('should handle null or empty ramo', () => {
      const claim = mockClaim({ ramo: '' });

      const dates = calculatePrescriptionDates(claim);
      expect(dates.ordinaria).not.toBeNull();
      expect(dates.extraordinaria).toBeNull();
    });
  });
});
