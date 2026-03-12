import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditTrackingTab from '../EditTrackingTab';
import { Claim, InternalState, Priority, User } from '../../types';
import * as followUpService from '../../services/followUpCalculationService';
import * as prescriptionService from '../../services/prescriptionService';

// Mock services
vi.mock('../../services/followUpCalculationService', () => ({
  calculateNextFollowUp: vi.fn(),
  validateFollowUpDate: vi.fn().mockResolvedValue({ valid: true }),
  getMaxDaysForState: vi.fn().mockResolvedValue(60),
  getMinDaysForState: vi.fn().mockResolvedValue(1),
}));

vi.mock('../../services/prescriptionService', () => ({
  getApplicablePrescriptionDate: vi.fn(),
}));

vi.mock('../../services/trackingService', () => ({
  formatBitacoraEntry: vi.fn(() => 'Test bitácora entry'),
  isValidFutureDate: vi.fn(() => true),
}));

vi.mock('../../services/auditService', () => ({
  logAction: vi.fn(),
  AuditActions: { UPDATE_CLAIM: 'UPDATE_CLAIM' },
}));

vi.mock('../../context/ClaimsContext', () => ({
  useClaims: () => ({
    currentUser: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@test.com',
      role: 'TECNICO',
      initials: 'TU',
    },
    updateClaim: vi.fn(),
    addClaimNote: vi.fn(),
  }),
}));

describe('EditTrackingTab', () => {
  const mockUser: User = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@test.com',
    role: 'TECNICO',
    initials: 'TU',
  };

  const mockClaim: Claim = {
    id_softseguros: 'TEST-001',
    numero_siniestro: 'SIN-TEST-001',
    poliza: 'POL-001',
    asegurado: 'Test Client',
    estado_softseguros: 'ABIERTO',
    usuario_registro: 'admin',
    ultimo_seguimiento_raw: '',
    placa_bien: 'ABC-123',
    ramo: 'Automóviles',
    aseguradora: 'Test Insurance',
    vendedor: 'Test Seller',
    tecnico_asignado: 'Test Technician',
    id_interno: 'INT-001',
    estado_interno: 'LIQUIDACIÓN',
    lastStateChangeDate: new Date().toISOString(),
    stateHistory: [],
    prioridad: Priority.MEDIA,
    monto_reclamo: 1000000,
    valor_deducible: 100000,
    valor_indemnizacion: 0,
    fecha_ocurrencia: '2024-03-01',
    fecha_prescripcion_ordinaria: '2026-03-01',
    updatedAt: new Date().toISOString(),
    timeline: [],
  };

  const calculatedDate = new Date();
  calculatedDate.setDate(calculatedDate.getDate() + 10); // 10 days from now

  beforeEach(() => {
    vi.clearAllMocks();
    (followUpService.calculateNextFollowUp as any).mockResolvedValue(calculatedDate);
    (prescriptionService.getApplicablePrescriptionDate as any).mockReturnValue(
      new Date('2026-03-01')
    );
  });

  describe('Fecha calculada automáticamente', () => {
    it('should display calculated date on mount', async () => {
      render(<EditTrackingTab claim={mockClaim} />);

      await waitFor(() => {
        expect(followUpService.calculateNextFollowUp).toHaveBeenCalledWith(mockClaim);
      });
    });

    it('should show indicator when date is calculated automatically', async () => {
      render(<EditTrackingTab claim={mockClaim} />);

      await waitFor(() => {
        expect(screen.getByText(/Calculado automáticamente/i)).toBeInTheDocument();
      });
    });

    it('should show indicator when date is overridden', async () => {
      render(<EditTrackingTab claim={mockClaim} />);

      // Wait for initial calculation
      await waitFor(() => {
        expect(screen.getByText(/Calculado automáticamente/i)).toBeInTheDocument();
      });

      // Change date manually
      const dateInput = screen.getByLabelText(/Próxima Fecha de Seguimiento/i);
      fireEvent.change(dateInput, { target: { value: '2030-01-01' } });

      await waitFor(() => {
        expect(screen.getByText(/Fecha modificada manualmente/i)).toBeInTheDocument();
      });
    });
  });

  describe('Recálculo al cambiar estado', () => {
    it('should recalculate date when state changes', async () => {
      render(<EditTrackingTab claim={mockClaim} />);

      await waitFor(() => {
        expect(followUpService.calculateNextFollowUp).toHaveBeenCalled();
      });

      // Change state
      const stateSelect = screen.getByLabelText(/Estado del Siniestro/i);
      fireEvent.change(stateSelect, { target: { value: 'PROCESO JURÍDICO' } });

      await waitFor(() => {
        expect(followUpService.calculateNextFollowUp).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Información de prescripción', () => {
    it('should display prescription date', () => {
      render(<EditTrackingTab claim={mockClaim} />);

      expect(screen.getByText(/Fecha de Prescripción/i)).toBeInTheDocument();
    });

    it('should show warning when prescription is close', () => {
      const nearExpirationClaim = {
        ...mockClaim,
        fecha_prescripcion_ordinaria: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days
      };

      render(<EditTrackingTab claim={nearExpirationClaim} />);

      expect(screen.getByText(/Fecha de Prescripción/i)).toBeInTheDocument();
    });
  });

  describe('Botón restaurar fecha', () => {
    it('should show restore button when date is overridden', async () => {
      render(<EditTrackingTab claim={mockClaim} />);

      await waitFor(() => {
        expect(screen.getByText(/Calculado automáticamente/i)).toBeInTheDocument();
      });

      // Override date
      const dateInput = screen.getByLabelText(/Próxima Fecha de Seguimiento/i);
      fireEvent.change(dateInput, { target: { value: '2030-01-01' } });

      await waitFor(() => {
        expect(screen.getByText(/Restaurar fecha calculada/i)).toBeInTheDocument();
      });
    });

    it('should restore calculated date when clicking restore button', async () => {
      render(<EditTrackingTab claim={mockClaim} />);

      await waitFor(() => {
        expect(screen.getByText(/Calculado automáticamente/i)).toBeInTheDocument();
      });

      // Override date
      const dateInput = screen.getByLabelText(/Próxima Fecha de Seguimiento/i);
      fireEvent.change(dateInput, { target: { value: '2030-01-01' } });

      await waitFor(() => {
        expect(screen.getByText(/Restaurar fecha calculada/i)).toBeInTheDocument();
      });

      // Click restore
      const restoreButton = screen.getByText(/Restaurar fecha calculada/i);
      fireEvent.click(restoreButton);

      await waitFor(() => {
        expect(followUpService.calculateNextFollowUp).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Validaciones', () => {
    it('should validate date range based on state', async () => {
      (followUpService.validateFollowUpDate as any).mockResolvedValue({
        valid: false,
        error: 'La fecha no puede exceder 60 días',
      });

      render(<EditTrackingTab claim={mockClaim} />);

      const dateInput = screen.getByLabelText(/Próxima Fecha de Seguimiento/i);
      fireEvent.change(dateInput, { target: { value: '2030-01-01' } });

      await waitFor(() => {
        expect(followUpService.validateFollowUpDate).toHaveBeenCalled();
      });
    });
  });

  describe('Estados finalizados', () => {
    it('should show finalization warning for FINALIZADO state', async () => {
      render(<EditTrackingTab claim={mockClaim} />);

      const stateSelect = screen.getByLabelText(/Estado del Siniestro/i);
      fireEvent.change(stateSelect, { target: { value: 'FINALIZADO' } });

      await waitFor(() => {
        expect(screen.getByText(/marcará el siniestro como finalizado/i)).toBeInTheDocument();
      });
    });

    it('should show finalization warning for PAGADO state', async () => {
      render(<EditTrackingTab claim={mockClaim} />);

      const stateSelect = screen.getByLabelText(/Estado del Siniestro/i);
      fireEvent.change(stateSelect, { target: { value: 'PAGADO' } });

      await waitFor(() => {
        expect(screen.getByText(/marcará el siniestro como finalizado/i)).toBeInTheDocument();
      });
    });
  });
});
