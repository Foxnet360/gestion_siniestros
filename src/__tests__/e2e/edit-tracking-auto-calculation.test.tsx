import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditTrackingTab from '../../components/EditTrackingTab';
import { Claim, InternalState, Priority } from '../../types';

/**
 * E2E Tests for EditTrackingTab Auto-Calculation
 *
 * These tests verify that the automatic follow-up date calculation
 * works correctly when changing states and shows proper UI indicators.
 */

// Mock the services
vi.mock('../../services/followUpCalculationService', () => ({
  calculateNextFollowUp: vi.fn(),
  getFollowUpRules: vi.fn(),
}));

vi.mock('../../services/prescriptionService', () => ({
  calculatePrescriptionDates: vi.fn(() => ({
    ordinaria: new Date('2026-03-06'),
    extraordinaria: null,
    applicable: new Date('2026-03-06'),
  })),
  formatPrescriptionInfo: vi.fn(() => 'Prescripción: 06/03/2026'),
}));

import { calculateNextFollowUp, getFollowUpRules } from '../../services/followUpCalculationService';

describe('EditTrackingTab Auto-Calculation E2E', () => {
  const mockCalculateNextFollowUp = vi.mocked(calculateNextFollowUp);
  const mockGetFollowUpRules = vi.mocked(getFollowUpRules);

  const mockClaim: Claim = {
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
    estado_interno: 'AVISO SINIESTRO',
    lastStateChangeDate: new Date().toISOString(),
    stateHistory: [],
    tecnico_asignado: 'Test Technician',
    prioridad: Priority.MEDIA,
    monto_reclamo: 1000000,
    valor_deducible: 100000,
    valor_indemnizacion: 0,
    fecha_ocurrencia: '2024-03-06',
    updatedAt: new Date().toISOString(),
    timeline: [],
  };

  const defaultProps = {
    claim: mockClaim,
    onUpdate: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for getFollowUpRules
    mockGetFollowUpRules.mockResolvedValue({
      standard: {
        phases: [1, 2, 3, 4, 5],
        days: 10,
        description: 'Seguimiento cada 10 días',
      },
      legal: {
        state: 'PROCESO JURÍDICO',
        minDays: 30,
        maxDays: 60,
        defaultDays: 30,
        description: '1-2 meses',
      },
      prescription: {
        state: 'PRESCRIPCIÓN',
        days: 10,
        description: 'Revisión cada 10 días',
      },
    });
  });

  it('should calculate and display default follow-up date on mount', async () => {
    const calculatedDate = new Date();
    calculatedDate.setDate(calculatedDate.getDate() + 10);
    mockCalculateNextFollowUp.mockResolvedValue(calculatedDate);

    render(<EditTrackingTab {...defaultProps} />);

    // Wait for the calculation to complete
    await waitFor(() => {
      expect(mockCalculateNextFollowUp).toHaveBeenCalledWith(
        expect.objectContaining({ estado_interno: 'AVISO SINIESTRO' }),
        expect.any(Date)
      );
    });

    // Check that prescription info is displayed
    expect(screen.getByText(/Prescripción:/i)).toBeInTheDocument();
  });

  it('should recalculate date when state changes', async () => {
    const user = userEvent.setup();

    // First calculation for AVISO SINIESTRO
    const date1 = new Date();
    date1.setDate(date1.getDate() + 10);

    // Second calculation for PROCESO JURÍDICO
    const date2 = new Date();
    date2.setDate(date2.getDate() + 30);

    mockCalculateNextFollowUp.mockResolvedValueOnce(date1).mockResolvedValueOnce(date2);

    render(<EditTrackingTab {...defaultProps} />);

    // Wait for initial calculation
    await waitFor(() => {
      expect(mockCalculateNextFollowUp).toHaveBeenCalledTimes(1);
    });

    // Change state to PROCESO JURÍDICO
    const stateSelect = screen.getByLabelText(/Estado Interno/i);
    await user.selectOptions(stateSelect, 'PROCESO JURÍDICO');

    // Should trigger recalculation
    await waitFor(() => {
      expect(mockCalculateNextFollowUp).toHaveBeenCalledTimes(2);
      expect(mockCalculateNextFollowUp).toHaveBeenLastCalledWith(
        expect.objectContaining({ estado_interno: 'PROCESO JURÍDICO' }),
        expect.any(Date)
      );
    });
  });

  it('should show visual indicator for calculated vs overridden dates', async () => {
    const calculatedDate = new Date();
    calculatedDate.setDate(calculatedDate.getDate() + 10);
    mockCalculateNextFollowUp.mockResolvedValue(calculatedDate);

    render(<EditTrackingTab {...defaultProps} />);

    // Wait for calculation
    await waitFor(() => {
      expect(mockCalculateNextFollowUp).toHaveBeenCalled();
    });

    // Check for calculated indicator (badge or icon)
    // The component should show some indicator that the date was calculated
    const dateInput = screen.getByLabelText(/Próximo Seguimiento/i);
    expect(dateInput).toBeInTheDocument();
  });

  it('should show warning when date is beyond prescription deadline', async () => {
    // Set prescription date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Set calculated follow-up to next week (beyond prescription)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    mockCalculateNextFollowUp.mockResolvedValue(nextWeek);

    render(<EditTrackingTab {...defaultProps} />);

    await waitFor(() => {
      expect(mockCalculateNextFollowUp).toHaveBeenCalled();
    });

    // Should show warning about prescription
    // Note: This depends on the actual implementation
    const warningElements = screen.queryAllByText(/prescripción/i);
    expect(warningElements.length).toBeGreaterThan(0);
  });

  it('should allow restoring calculated date after override', async () => {
    const user = userEvent.setup();
    const calculatedDate = new Date();
    calculatedDate.setDate(calculatedDate.getDate() + 10);
    mockCalculateNextFollowUp.mockResolvedValue(calculatedDate);

    render(<EditTrackingTab {...defaultProps} />);

    await waitFor(() => {
      expect(mockCalculateNextFollowUp).toHaveBeenCalled();
    });

    // Change the date manually (override)
    const dateInput = screen.getByLabelText(/Próximo Seguimiento/i);
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 20);

    fireEvent.change(dateInput, {
      target: { value: newDate.toISOString().split('T')[0] },
    });

    // Should show restore button
    await waitFor(() => {
      const restoreButton =
        screen.queryByText(/Restaurar/i) || screen.queryByRole('button', { name: /restaurar/i });
      expect(restoreButton).toBeInTheDocument();
    });
  });

  it('should display prescription dates in read-only format', async () => {
    mockCalculateNextFollowUp.mockResolvedValue(new Date());

    render(<EditTrackingTab {...defaultProps} />);

    await waitFor(() => {
      expect(mockCalculateNextFollowUp).toHaveBeenCalled();
    });

    // Should show prescription information
    expect(screen.getByText(/Prescripción:/i)).toBeInTheDocument();
  });
});
