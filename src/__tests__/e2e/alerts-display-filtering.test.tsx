import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AlertsPanel from '../../components/AlertsPanel';
import { Claim, AlertLevel, InternalState, Priority } from '../../types';

/**
 * E2E Tests for Alert Display and Filtering
 *
 * These tests verify that alerts are displayed correctly
 * and that filtering by alert level works properly.
 */

// Mock the services
vi.mock('../../services/alertService', () => ({
  evaluateAlerts: vi.fn(),
  getNotificationPreferences: vi.fn(),
}));

vi.mock('../../services/prescriptionService', () => ({
  getPrescriptionAlertLevel: vi.fn(),
  formatPrescriptionInfo: vi.fn(),
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

describe('Alert Display and Filtering E2E', () => {
  const mockClaims: Claim[] = [
    {
      id_softseguros: 'TEST-001',
      numero_siniestro: 'SIN-001',
      poliza: 'POL-001',
      asegurado: 'Client 1',
      estado_softseguros: 'ABIERTO',
      usuario_registro: 'user1',
      ultimo_seguimiento_raw: '',
      placa_bien: 'ABC-123',
      ramo: 'Automóviles',
      aseguradora: 'Insurance Co',
      vendedor: 'Seller 1',
      id_interno: 'INT-001',
      estado_interno: 'LIQUIDACIÓN' as InternalState,
      lastStateChangeDate: new Date().toISOString(),
      stateHistory: [],
      tecnico_asignado: 'Tech 1',
      prioridad: Priority.ALTA,
      monto_reclamo: 5000000,
      valor_deducible: 500000,
      valor_indemnizacion: 0,
      alert_level: 'critical' as AlertLevel,
      fecha_prescripcion_ordinaria: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days
      updatedAt: new Date().toISOString(),
      timeline: [],
    },
    {
      id_softseguros: 'TEST-002',
      numero_siniestro: 'SIN-002',
      poliza: 'POL-002',
      asegurado: 'Client 2',
      estado_softseguros: 'ABIERTO',
      usuario_registro: 'user2',
      ultimo_seguimiento_raw: '',
      placa_bien: 'DEF-456',
      ramo: 'Hogar',
      aseguradora: 'Insurance Co',
      vendedor: 'Seller 2',
      id_interno: 'INT-002',
      estado_interno: 'DOCUMENTACIÓN' as InternalState,
      lastStateChangeDate: new Date().toISOString(),
      stateHistory: [],
      tecnico_asignado: 'Tech 2',
      prioridad: Priority.MEDIA,
      monto_reclamo: 3000000,
      valor_deducible: 300000,
      valor_indemnizacion: 0,
      alert_level: 'warning' as AlertLevel,
      fecha_prescripcion_ordinaria: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
      updatedAt: new Date().toISOString(),
      timeline: [],
    },
    {
      id_softseguros: 'TEST-003',
      numero_siniestro: 'SIN-003',
      poliza: 'POL-003',
      asegurado: 'Client 3',
      estado_softseguros: 'ABIERTO',
      usuario_registro: 'user3',
      ultimo_seguimiento_raw: '',
      placa_bien: 'GHI-789',
      ramo: 'Vida',
      aseguradora: 'Insurance Co',
      vendedor: 'Seller 3',
      id_interno: 'INT-003',
      estado_interno: 'AVISO SINIESTRO' as InternalState,
      lastStateChangeDate: new Date().toISOString(),
      stateHistory: [],
      tecnico_asignado: 'Tech 3',
      prioridad: Priority.BAJA,
      monto_reclamo: 1000000,
      valor_deducible: 100000,
      valor_indemnizacion: 0,
      alert_level: 'normal' as AlertLevel,
      fecha_prescripcion_ordinaria: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString(), // 200 days
      updatedAt: new Date().toISOString(),
      timeline: [],
    },
  ];

  const defaultProps = {
    claims: mockClaims,
    onSelectClaim: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display all claims with their alert badges', () => {
    render(<AlertsPanel {...defaultProps} />);

    // Should show all three claims
    expect(screen.getByText('SIN-001')).toBeInTheDocument();
    expect(screen.getByText('SIN-002')).toBeInTheDocument();
    expect(screen.getByText('SIN-003')).toBeInTheDocument();
  });

  it('should show critical alert with red styling', () => {
    render(<AlertsPanel {...defaultProps} />);

    // Find the critical alert
    const criticalBadge = screen
      .getByText('SIN-001')
      .closest('tr')
      ?.querySelector('[data-alert-level="critical"]');
    expect(criticalBadge).toBeInTheDocument();
  });

  it('should show warning alert with amber styling', () => {
    render(<AlertsPanel {...defaultProps} />);

    // Find the warning alert
    const warningBadge = screen
      .getByText('SIN-002')
      .closest('tr')
      ?.querySelector('[data-alert-level="warning"]');
    expect(warningBadge).toBeInTheDocument();
  });

  it('should filter claims by critical alert level', async () => {
    const user = userEvent.setup();
    render(<AlertsPanel {...defaultProps} />);

    // Select critical filter
    const filterSelect = screen.getByLabelText(/Filtrar por nivel/i);
    await user.selectOptions(filterSelect, 'critical');

    // Should only show critical claim
    expect(screen.getByText('SIN-001')).toBeInTheDocument();
    expect(screen.queryByText('SIN-002')).not.toBeInTheDocument();
    expect(screen.queryByText('SIN-003')).not.toBeInTheDocument();
  });

  it('should filter claims by warning alert level', async () => {
    const user = userEvent.setup();
    render(<AlertsPanel {...defaultProps} />);

    // Select warning filter
    const filterSelect = screen.getByLabelText(/Filtrar por nivel/i);
    await user.selectOptions(filterSelect, 'warning');

    // Should only show warning claim
    expect(screen.queryByText('SIN-001')).not.toBeInTheDocument();
    expect(screen.getByText('SIN-002')).toBeInTheDocument();
    expect(screen.queryByText('SIN-003')).not.toBeInTheDocument();
  });

  it('should show alert counts by severity', () => {
    render(<AlertsPanel {...defaultProps} />);

    // Should show summary counts
    expect(screen.getByText(/1 crítica/i)).toBeInTheDocument();
    expect(screen.getByText(/1 advertencia/i)).toBeInTheDocument();
    expect(screen.getByText(/1 normal/i)).toBeInTheDocument();
  });

  it('should call onSelectClaim when clicking a claim', async () => {
    const user = userEvent.setup();
    const onSelectClaim = vi.fn();

    render(<AlertsPanel {...defaultProps} onSelectClaim={onSelectClaim} />);

    // Click on first claim
    const claimRow = screen.getByText('SIN-001').closest('tr');
    if (claimRow) {
      await user.click(claimRow);
      expect(onSelectClaim).toHaveBeenCalledWith(
        expect.objectContaining({
          id_softseguros: 'TEST-001',
        })
      );
    }
  });

  it('should show empty state when no alerts match filter', async () => {
    const user = userEvent.setup();
    render(<AlertsPanel {...defaultProps} claims={[]} />);

    // Should show empty state message
    expect(screen.getByText(/No hay alertas/i)).toBeInTheDocument();
  });

  it('should sort claims with critical alerts first', () => {
    render(<AlertsPanel {...defaultProps} />);

    // Get all claim rows
    const rows = screen.getAllByRole('row');

    // First data row should be the critical one
    expect(rows[1]).toHaveTextContent('SIN-001');
  });
});
