import { describe, it, expect } from 'vitest';
import {
  getDaysSinceLastChange,
  isInFinalState,
  isStagnant,
  getPrescriptionRisk,
  STAGNANT_THRESHOLD_DAYS,
} from '../../utils/claimUtils';
import { Claim, Priority } from '../../types';

describe('claimUtils', () => {
  const mockClaim: Claim = {
    id_softseguros: 'TEST-001',
    numero_siniestro: 'SIN-001',
    poliza: 'POL-001',
    asegurado: 'Test User',
    estado_softseguros: 'ABIERTO',
    usuario_registro: 'admin',
    ultimo_seguimiento_raw: 'Test',
    placa_bien: 'ABC123',
    ramo: 'Autos',
    aseguradora: 'Test Insurance',
    vendedor: 'Seller1',
    tecnico_asignado: 'Tech1',
    id_interno: 'INT-001',
    estado_interno: 'AVISO SINIESTRO',
    lastStateChangeDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    stateHistory: [],
    prioridad: Priority.MEDIA,
    monto_reclamo: 1000000,
    valor_deducible: 100000,
    valor_indemnizacion: 0,
    updatedAt: new Date().toISOString(),
    timeline: [],
  };

  describe('getDaysSinceLastChange', () => {
    it('calcula correctamente días desde último cambio', () => {
      const days = getDaysSinceLastChange(mockClaim);
      expect(days).toBeGreaterThanOrEqual(5);
      expect(days).toBeLessThanOrEqual(6);
    });

    it('usa updatedAt si no hay lastStateChangeDate', () => {
      const claimWithoutLastChange = {
        ...mockClaim,
        lastStateChangeDate: undefined,
      };
      const days = getDaysSinceLastChange(claimWithoutLastChange);
      expect(days).toBe(0);
    });
  });

  describe('isInFinalState', () => {
    it('retorna true para estado PAGADO', () => {
      const claim = { ...mockClaim, estado_interno: 'PAGADO' as const };
      expect(isInFinalState(claim)).toBe(true);
    });

    it('retorna true para estado FINALIZADO', () => {
      const claim = { ...mockClaim, estado_interno: 'FINALIZADO' as const };
      expect(isInFinalState(claim)).toBe(true);
    });

    it('retorna false para estado activo', () => {
      expect(isInFinalState(mockClaim)).toBe(false);
    });
  });

  describe('isStagnant', () => {
    it('retorna false para casos en estado final', () => {
      const claim = {
        ...mockClaim,
        estado_interno: 'PAGADO' as const,
        lastStateChangeDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100).toISOString(),
      };
      expect(isStagnant(claim)).toBe(false);
    });

    it('retorna false si no supera el umbral', () => {
      expect(isStagnant(mockClaim)).toBe(false);
    });

    it('retorna true si supera el umbral por defecto', () => {
      const claim = {
        ...mockClaim,
        lastStateChangeDate: new Date(
          Date.now() - 1000 * 60 * 60 * 24 * (STAGNANT_THRESHOLD_DAYS + 1)
        ).toISOString(),
      };
      expect(isStagnant(claim)).toBe(true);
    });

    it('respeta umbral personalizado', () => {
      const claim = {
        ...mockClaim,
        lastStateChangeDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      };
      expect(isStagnant(claim, 5)).toBe(true);
      expect(isStagnant(claim, 15)).toBe(false);
    });
  });

  describe('getPrescriptionRisk', () => {
    it('retorna none si no hay fecha de ocurrencia', () => {
      const claim = { ...mockClaim, fecha_ocurrencia: undefined };
      const risk = getPrescriptionRisk(claim);
      expect(risk.level).toBe('none');
    });

    it('retorna none para estados finales', () => {
      const claim = {
        ...mockClaim,
        estado_interno: 'PAGADO' as const,
        fecha_ocurrencia: new Date(Date.now() - 1000 * 60 * 60 * 24 * 700).toISOString(),
      };
      const risk = getPrescriptionRisk(claim);
      expect(risk.level).toBe('none');
    });

    it('calcula días restantes correctamente', () => {
      const daysAgo = 600; // ~1.6 años
      const claim = {
        ...mockClaim,
        fecha_ocurrencia: new Date(Date.now() - 1000 * 60 * 60 * 24 * daysAgo).toISOString(),
      };
      const risk = getPrescriptionRisk(claim);
      expect(risk.daysToOrdinary).toBeGreaterThan(0);
      expect(risk.daysToOrdinary).toBeLessThan(200);
    });
  });
});
