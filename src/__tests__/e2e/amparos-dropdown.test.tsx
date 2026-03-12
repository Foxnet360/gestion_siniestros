import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AmparosDropdown } from '../../components/Amparos/AmparosDropdown';

/**
 * E2E Tests for Amparos Dropdown
 *
 * These tests verify the functionality of the AmparosDropdown component
 * including selection, validation, and search capabilities.
 */

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() =>
          Promise.resolve({
            data: [
              { id: '1', nombre: 'Daños Materiales', categoria: 'OTRO', activo: true },
              { id: '2', nombre: 'Responsabilidad Civil', categoria: 'OTRO', activo: true },
              { id: '3', nombre: 'Accidentes Personales', categoria: 'VIDA', activo: true },
              { id: '4', nombre: 'Gastos Médicos', categoria: 'SALUD', activo: true },
            ],
            error: null,
          })
        ),
      })),
    })),
  })),
};

vi.mock('../../lib/supabase', () => ({
  supabase: mockSupabase,
}));

describe('AmparosDropdown E2E', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dropdown with placeholder', async () => {
    render(
      <AmparosDropdown value={[]} onChange={mockOnChange} placeholder="Seleccione amparos..." />
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Seleccione amparos...')).toBeInTheDocument();
  });

  it('should open dropdown when clicked', async () => {
    const user = userEvent.setup();

    render(<AmparosDropdown value={[]} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
    });

    // Click to open
    const dropdown = screen.getByText('Seleccione amparos...');
    await user.click(dropdown);

    // Check that options are displayed
    await waitFor(() => {
      expect(screen.getByText('Daños Materiales')).toBeInTheDocument();
      expect(screen.getByText('Responsabilidad Civil')).toBeInTheDocument();
    });
  });

  it('should select single amparo', async () => {
    const user = userEvent.setup();

    render(<AmparosDropdown value={[]} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
    });

    // Open dropdown
    const dropdown = screen.getByText('Seleccione amparos...');
    await user.click(dropdown);

    // Select an option
    const option = await screen.findByText('Daños Materiales');
    await user.click(option);

    // Verify onChange was called with selected value
    expect(mockOnChange).toHaveBeenCalledWith(['1']);
  });

  it('should select multiple amparos', async () => {
    const user = userEvent.setup();

    render(<AmparosDropdown value={[]} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
    });

    // Open dropdown
    const dropdown = screen.getByText('Seleccione amparos...');
    await user.click(dropdown);

    // Select first option
    const option1 = await screen.findByText('Daños Materiales');
    await user.click(option1);

    // Select second option
    const option2 = await screen.findByText('Responsabilidad Civil');
    await user.click(option2);

    // Verify onChange was called with both values
    expect(mockOnChange).toHaveBeenLastCalledWith(['1', '2']);
  });

  it('should remove selected amparo when clicking X', async () => {
    const user = userEvent.setup();

    render(<AmparosDropdown value={['1', '2']} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
    });

    // Find and click remove button on first tag
    const removeButton = screen.getAllByRole('button', { name: /remove/i })[0];
    await user.click(removeButton);

    // Verify onChange was called with remaining value
    expect(mockOnChange).toHaveBeenCalledWith(['2']);
  });

  it('should filter options when searching', async () => {
    const user = userEvent.setup();

    render(<AmparosDropdown value={[]} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
    });

    // Open dropdown
    const dropdown = screen.getByText('Seleccione amparos...');
    await user.click(dropdown);

    // Type in search box
    const searchInput = screen.getByPlaceholderText('Buscar amparo...');
    await user.type(searchInput, 'Daños');

    // Verify filtered results
    await waitFor(() => {
      expect(screen.getByText('Daños Materiales')).toBeInTheDocument();
      expect(screen.queryByText('Responsabilidad Civil')).not.toBeInTheDocument();
    });
  });

  it('should show required validation error', async () => {
    render(<AmparosDropdown value={[]} onChange={mockOnChange} required />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Este campo es obligatorio')).toBeInTheDocument();
  });

  it('should not show error when value is selected', async () => {
    render(<AmparosDropdown value={['1']} onChange={mockOnChange} required />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
    });

    expect(screen.queryByText('Este campo es obligatorio')).not.toBeInTheDocument();
  });

  it('should show custom error message', async () => {
    render(
      <AmparosDropdown
        value={[]}
        onChange={mockOnChange}
        error="Debe seleccionar al menos un amparo"
      />
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Debe seleccionar al menos un amparo')).toBeInTheDocument();
  });

  it('should close dropdown when clicking outside', async () => {
    const user = userEvent.setup();

    render(
      <div>
        <AmparosDropdown value={[]} onChange={mockOnChange} />
        <div data-testid="outside">Outside element</div>
      </div>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
    });

    // Open dropdown
    const dropdown = screen.getByText('Seleccione amparos...');
    await user.click(dropdown);

    // Verify dropdown is open
    expect(screen.getByText('Daños Materiales')).toBeInTheDocument();

    // Click outside
    const outside = screen.getByTestId('outside');
    await user.click(outside);

    // Verify dropdown is closed
    await waitFor(() => {
      expect(screen.queryByText('Daños Materiales')).not.toBeInTheDocument();
    });
  });

  it('should disable interaction when disabled prop is true', async () => {
    const user = userEvent.setup();

    render(<AmparosDropdown value={['1']} onChange={mockOnChange} disabled />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
    });

    // Try to open dropdown
    const dropdown = screen.getByText('Daños Materiales'); // Selected value shown
    await user.click(dropdown);

    // Dropdown should not open
    expect(screen.queryByPlaceholderText('Buscar amparo...')).not.toBeInTheDocument();
  });

  it('should display selected amparos as tags', async () => {
    render(<AmparosDropdown value={['1', '2']} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
    });

    // Check that selected values are displayed as tags
    expect(screen.getByText('Daños Materiales')).toBeInTheDocument();
    expect(screen.getByText('Responsabilidad Civil')).toBeInTheDocument();
  });
});
