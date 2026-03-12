import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  processPrescriptionClosures,
  processLegalStagnation,
  CloseResult,
  AutoCloseConfig,
} from '../autoCloseService';
import { Claim, User, Priority, InternalState } from '../../types';
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
          eq: vi.fn(() => ({
            then: vi.fn(),
          })),
          in: vi.fn(() => ({
            then: vi.fn(),
          })),
        })),
        eq: vi.fn(() => ({
          single: vi.fn(),
          then: vi.fn(),
        })),
        in: vi.fn(() => ({
          then: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          then: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        then: vi.fn(),
      })),
    })),
  },
}));

describe('AutoCloseService', () => {
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
    tecnico_id: 'tech-001',
    id_interno: 'INT-001',
    estado_interno: 'LIQUIDACIÓN' as InternalState,
    lastStateChangeDate: new Date().toISOString(),
    stateHistory: [],
    prioridad: Priority.MEDIA,
    monto_reclamo: 1000000,
    valor_deducible: 100000,
    valor_indemnizacion: 0,
    fecha_ocurrencia: '2020-03-06', // 6 years ago - expired prescription
    fecha_prescripcion_ordinaria: '2022-03-06', // 2 years from occurrence
    fecha_prescripcion_extraordinaria: undefined,
    alert_level: 'normal',
    proximo_seguimiento: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: [],
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('processPrescriptionClosures', () => {
    it('should auto-close claims with expired prescription', async () => {
      // Claim with prescription expired 4 years ago
      const expiredClaim = mockClaim({
        id_softseguros: 'TEST-001',
        numero_siniestro: 'SIN-EXPIRED',
        fecha_ocurrencia: '2020-01-01',
        fecha_prescripcion_ordinaria: '2022-01-01',
        monto_reclamo: 1000000, // Below threshold
      });

      const mockSelect = vi.fn().mockReturnValue({
        not: vi.fn().mockReturnValue({
          not: vi.fn().mockResolvedValue({ data: [expiredClaim], error: null }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'claims') {
          return {
            select: mockSelect,
            update: mockUpdate,
          };
        }
        if (table === 'app_config') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    config_value: {
                      highValueThreshold: 50000000,
                      highPriorityExclusion: ['ALTA'],
                      autoCloseStates: ['PRESCRIPCIÓN'],
                      pendingApprovalState: 'CIERRE PENDIENTE APROBACIÓN',
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn(),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      });

      const results = await processPrescriptionClosures();

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].reason).toBe('prescription_ordinary');
    });

    it('should send high-value claims for manual approval', async () => {
      const highValueClaim = mockClaim({
        id_softseguros: 'TEST-002',
        numero_siniestro: 'SIN-HIGH-VALUE',
        monto_reclamo: 100000000, // Above $50M threshold
        fecha_ocurrencia: '2020-01-01',
        fecha_prescripcion_ordinaria: '2022-01-01',
      });

      const mockSelect = vi.fn().mockReturnValue({
        not: vi.fn().mockReturnValue({
          not: vi.fn().mockResolvedValue({ data: [highValueClaim], error: null }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'claims') {
          return {
            select: mockSelect,
            update: mockUpdate,
          };
        }
        if (table === 'app_config') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    config_value: {
                      highValueThreshold: 50000000,
                      highPriorityExclusion: ['ALTA'],
                      autoCloseStates: ['PRESCRIPCIÓN'],
                      pendingApprovalState: 'CIERRE PENDIENTE APROBACIÓN',
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: vi.fn(), insert: vi.fn().mockResolvedValue({ error: null }) };
      });

      const results = await processPrescriptionClosures();

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].reason).toBe('pending_approval');
      expect(results[0].message).toContain('aprobación manual');
    });

    it('should exclude high-priority claims from auto-close', async () => {
      const highPriorityClaim = mockClaim({
        id_softseguros: 'TEST-003',
        numero_siniestro: 'SIN-HIGH-PRIORITY',
        prioridad: Priority.ALTA,
        fecha_ocurrencia: '2020-01-01',
        fecha_prescripcion_ordinaria: '2022-01-01',
      });

      const mockSelect = vi.fn().mockReturnValue({
        not: vi.fn().mockReturnValue({
          not: vi.fn().mockResolvedValue({ data: [highPriorityClaim], error: null }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'claims') {
          return {
            select: mockSelect,
            update: mockUpdate,
          };
        }
        if (table === 'app_config') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    config_value: {
                      highValueThreshold: 50000000,
                      highPriorityExclusion: ['ALTA'],
                      autoCloseStates: ['PRESCRIPCIÓN'],
                      pendingApprovalState: 'CIERRE PENDIENTE APROBACIÓN',
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: vi.fn(), insert: vi.fn().mockResolvedValue({ error: null }) };
      });

      const results = await processPrescriptionClosures();

      expect(results).toHaveLength(1);
      expect(results[0].reason).toBe('pending_approval');
    });

    it('should handle claims without prescription dates', async () => {
      const noPrescriptionClaim = mockClaim({
        fecha_ocurrencia: undefined,
        fecha_prescripcion_ordinaria: undefined,
      });

      const mockSelect = vi.fn().mockReturnValue({
        not: vi.fn().mockReturnValue({
          not: vi.fn().mockResolvedValue({ data: [noPrescriptionClaim], error: null }),
        }),
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'claims') {
          return { select: mockSelect };
        }
        return { select: vi.fn() };
      });

      const results = await processPrescriptionClosures();

      // Should not process claims without prescription dates
      expect(results).toHaveLength(0);
    });

    it('should handle database errors gracefully', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        not: vi.fn().mockReturnValue({
          not: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const results = await processPrescriptionClosures();

      expect(results).toHaveLength(0);
    });
  });

  describe('processLegalStagnation', () => {
    it('should auto-close claims in legal process after 5 years', async () => {
      const oldLegalClaim = mockClaim({
        id_softseguros: 'TEST-004',
        numero_siniestro: 'SIN-OLD-LEGAL',
        estado_interno: 'PROCESO JURÍDICO',
        lastStateChangeDate: '2020-01-01', // 6+ years ago
        fecha_ocurrencia: '2020-01-01',
      });

      const mockSelect = vi.fn().mockReturnValue({
        not: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [oldLegalClaim], error: null }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'claims') {
          return {
            select: mockSelect,
            update: mockUpdate,
          };
        }
        if (table === 'app_config') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    config_value: {
                      alert_thresholds: {
                        legalStagnant: {
                          warningMonths: 24,
                          closeYears: 5,
                        },
                      },
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'timeline') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        return { select: vi.fn(), insert: vi.fn().mockResolvedValue({ error: null }) };
      });

      const results = await processLegalStagnation();

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].reason).toBe('legal_stagnation');
    });

    it('should generate warning for claims in legal process after 24 months', async () => {
      const twoYearLegalClaim = mockClaim({
        id_softseguros: 'TEST-005',
        numero_siniestro: 'SIN-2YR-LEGAL',
        estado_interno: 'PROCESO JURÍDICO',
        lastStateChangeDate: new Date(Date.now() - 25 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 25 months ago
        alert_level: 'normal',
      });

      const mockSelect = vi.fn().mockReturnValue({
        not: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [twoYearLegalClaim], error: null }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'claims') {
          return {
            select: mockSelect,
            update: mockUpdate,
          };
        }
        if (table === 'app_config') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    config_value: {
                      alert_thresholds: {
                        legalStagnant: {
                          warningMonths: 24,
                          closeYears: 5,
                        },
                      },
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'timeline') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        return { select: vi.fn(), insert: vi.fn().mockResolvedValue({ error: null }) };
      });

      const results = await processLegalStagnation();

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].message).toContain('meses');
    });

    it('should not close claims with recent activity', async () => {
      const oldButActiveClaim = mockClaim({
        id_softseguros: 'TEST-006',
        numero_siniestro: 'SIN-ACTIVE',
        estado_interno: 'PROCESO JURÍDICO',
        lastStateChangeDate: '2020-01-01', // Old state change
      });

      const recentTimeline = [{ id: 'event-1', date: new Date().toISOString() }];

      const mockSelect = vi.fn().mockReturnValue({
        not: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [oldButActiveClaim], error: null }),
        }),
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'claims') {
          return { select: mockSelect };
        }
        if (table === 'app_config') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    config_value: {
                      alert_thresholds: {
                        legalStagnant: {
                          warningMonths: 24,
                          closeYears: 5,
                        },
                      },
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'timeline') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: recentTimeline, error: null }),
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const results = await processLegalStagnation();

      // Should not process claims with recent activity
      expect(results).toHaveLength(0);
    });

    it('should handle empty legal process claims', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        not: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const results = await processLegalStagnation();

      expect(results).toHaveLength(0);
    });
  });

  describe('Extraordinary Prescription', () => {
    it('should handle RC claims with 5-year prescription', async () => {
      const rcClaim = mockClaim({
        id_softseguros: 'TEST-007',
        numero_siniestro: 'SIN-RC',
        ramo: 'Responsabilidad Civil',
        fecha_ocurrencia: '2018-01-01', // 8 years ago
        fecha_prescripcion_ordinaria: '2020-01-01', // 2 years
        fecha_prescripcion_extraordinaria: '2023-01-01', // 5 years - expired 3 years ago
      });

      const mockSelect = vi.fn().mockReturnValue({
        not: vi.fn().mockReturnValue({
          not: vi.fn().mockResolvedValue({ data: [rcClaim], error: null }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'claims') {
          return {
            select: mockSelect,
            update: mockUpdate,
          };
        }
        if (table === 'app_config') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    config_value: {
                      highValueThreshold: 50000000,
                      highPriorityExclusion: ['ALTA'],
                      autoCloseStates: ['PRESCRIPCIÓN'],
                      pendingApprovalState: 'CIERRE PENDIENTE APROBACIÓN',
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: vi.fn(), insert: vi.fn().mockResolvedValue({ error: null }) };
      });

      const results = await processPrescriptionClosures();

      expect(results).toHaveLength(1);
      expect(results[0].reason).toBe('prescription_extraordinary');
      expect(results[0].message).toContain('extraordinaria');
    });
  });
});
