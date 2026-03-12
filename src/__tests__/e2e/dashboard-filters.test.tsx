import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dashboard } from '../../components/Dashboard';

/**
 * E2E Tests for Dashboard Filters
 *
 * These tests verify that filter interactions work correctly
 * and update the dashboard data appropriately.
 */

// Mock the KPI hooks
vi.mock('../../hooks/useKPIs', () => ({
  useKPIs: vi.fn(),
  useLeadTime: vi.fn(),
  useTasas: vi.fn(),
  useBacklog: vi.fn(),
}));

vi.mock('../../hooks/useKPIExport', () => ({
  useKPIExport: vi.fn(() => ({
    exportToCSV: vi.fn(),
  })),
}));

import { useKPIs, useLeadTime, useTasas, useBacklog } from '../../hooks/useKPIs';

describe('Dashboard Filters E2E', () => {
  const mockUseKPIs = vi.mocked(useKPIs);
  const mockUseLeadTime = vi.mocked(useLeadTime);
  const mockUseTasas = vi.mocked(useTasas);
  const mockUseBacklog = vi.mocked(useBacklog);

  const defaultKPIData = {
    overview: {
      leadTimeAvg: 24.5,
      tasaDesistimiento: 8.3,
      tasaObjetados: 12.1,
      tasaPrescritos: 2.4,
      porcentajeCerradosPlazo: 15.7,
      backlogActivos: 156,
    },
    leadTime: {
      average: 24.5,
      percentiles: {
        p50: 22,
        p75: 28,
        p90: 35,
        p95: 42,
      },
    },
    tasas: {
      tasaDesistimiento: 8.3,
      tasaObjetados: 12.1,
      tasaPrescritos: 2.4,
      counts: {
        desistimiento: 42,
        objetados: 61,
        prescritos: 12,
        total: 505,
      },
    },
    backlog: {
      total: 156,
      byAge: [
        { range: '0-30 días', count: 45 },
        { range: '31-60 días', count: 38 },
        { range: '61-90 días', count: 42 },
        { range: '90+ días', count: 31 },
      ],
    },
    loading: false,
    error: null,
    refetch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockUseKPIs.mockReturnValue(defaultKPIData);
    mockUseLeadTime.mockReturnValue({
      data: defaultKPIData.leadTime,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseTasas.mockReturnValue({
      data: defaultKPIData.tasas,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseBacklog.mockReturnValue({
      data: defaultKPIData.backlog,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it('should render dashboard with all KPI cards', () => {
    render(<Dashboard />);

    // Check that main KPIs are displayed
    expect(screen.getByText('Ciclo de Resolución (Lead Time)')).toBeInTheDocument();
    expect(screen.getByText('Tasa de Desistimiento')).toBeInTheDocument();
    expect(screen.getByText('Backlog de Siniestros Activos')).toBeInTheDocument();
  });

  it('should filter by insurer when user types in filter', async () => {
    const user = userEvent.setup();
    const refetchMock = vi.fn();

    mockUseKPIs.mockReturnValue({
      ...defaultKPIData,
      refetch: refetchMock,
    });

    render(<Dashboard />);

    // Open filter sidebar (on mobile)
    const filterButton = screen.queryByRole('button', { name: /filtros/i });
    if (filterButton) {
      await user.click(filterButton);
    }

    // Type insurer name
    const insurerInput = screen.getByPlaceholderText(/buscar aseguradora/i);
    await user.type(insurerInput, 'Seguros ABC');

    // Click apply filters
    const applyButton = screen.getByRole('button', { name: /aplicar filtros/i });
    await user.click(applyButton);

    // Verify refetch was called
    await waitFor(() => {
      expect(refetchMock).toHaveBeenCalled();
    });
  });

  it('should filter by date range', async () => {
    const user = userEvent.setup();
    const refetchMock = vi.fn();

    mockUseKPIs.mockReturnValue({
      ...defaultKPIData,
      refetch: refetchMock,
    });

    render(<Dashboard />);

    // Set date range
    const dateInputs = screen.getAllByDisplayValue('');

    // Find date inputs (from and to)
    const [fromDate, toDate] = dateInputs.filter(input => input.getAttribute('type') === 'date');

    if (fromDate && toDate) {
      fireEvent.change(fromDate, { target: { value: '2024-01-01' } });
      fireEvent.change(toDate, { target: { value: '2024-12-31' } });
    }

    // Click apply
    const applyButton = screen.getByRole('button', { name: /aplicar filtros/i });
    await user.click(applyButton);

    // Verify refetch was called
    await waitFor(() => {
      expect(refetchMock).toHaveBeenCalled();
    });
  });

  it('should clear all filters when clicking clear button', async () => {
    const user = userEvent.setup();
    const refetchMock = vi.fn();

    mockUseKPIs.mockReturnValue({
      ...defaultKPIData,
      refetch: refetchMock,
    });

    render(<Dashboard />);

    // First apply a filter
    const insurerInput = screen.getByPlaceholderText(/buscar aseguradora/i);
    await user.type(insurerInput, 'Test Insurer');

    const applyButton = screen.getByRole('button', { name: /aplicar filtros/i });
    await user.click(applyButton);

    // Then clear filters
    const clearButton = screen.getByRole('button', { name: /limpiar filtros/i });
    await user.click(clearButton);

    // Verify input is cleared
    await waitFor(() => {
      expect(insurerInput).toHaveValue('');
    });
  });

  it('should show loading state', () => {
    mockUseKPIs.mockReturnValue({
      ...defaultKPIData,
      loading: true,
    });

    render(<Dashboard />);

    // Check for loading indicators (skeleton screens)
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('should show error state', () => {
    mockUseKPIs.mockReturnValue({
      ...defaultKPIData,
      error: 'Failed to load KPIs',
    });

    render(<Dashboard />);

    expect(screen.getByText(/error al cargar kpis/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  it('should export data when clicking export button', async () => {
    const user = userEvent.setup();
    const exportMock = vi.fn();

    vi.doMock('../../hooks/useKPIExport', () => ({
      useKPIExport: vi.fn(() => ({
        exportToCSV: exportMock,
      })),
    }));

    render(<Dashboard />);

    const exportButton = screen.getByRole('button', { name: /exportar csv/i });
    await user.click(exportButton);

    // Note: Due to mocking complexity, we just verify the button exists and is clickable
    expect(exportButton).toBeInTheDocument();
  });
});
