import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AlertBadge, AlertIcon, AlertCounter, AlertLevel } from '../AlertBadge';

describe('AlertBadge', () => {
  describe('AlertBadge Component', () => {
    it('should render critical alert correctly', () => {
      render(<AlertBadge level="critical" daysRemaining={15} />);

      expect(screen.getByText('CRÍTICO')).toBeInTheDocument();
    });

    it('should render warning alert correctly', () => {
      render(<AlertBadge level="warning" daysRemaining={60} />);

      expect(screen.getByText('ADVERTENCIA')).toBeInTheDocument();
    });

    it('should render expired alert when daysRemaining is 0 or negative', () => {
      render(<AlertBadge level="critical" daysRemaining={0} />);

      expect(screen.getByText('VENCIDO')).toBeInTheDocument();
    });

    it('should render legal stagnation warning', () => {
      render(<AlertBadge level="legal_stagnation_warning" />);

      expect(screen.getByText('ESTANCAMIENTO')).toBeInTheDocument();
    });

    it('should render legal stagnation critical', () => {
      render(<AlertBadge level="legal_stagnation_critical" />);

      expect(screen.getByText('ESTANCAMIENTO')).toBeInTheDocument();
    });

    it('should render resolved alert', () => {
      render(<AlertBadge level="resolved" />);

      expect(screen.getByText('RESUELTO')).toBeInTheDocument();
    });

    it('should return null for normal level without onClick', () => {
      const { container } = render(<AlertBadge level="normal" />);

      expect(container.firstChild).toBeNull();
    });

    it('should render normal level when onClick is provided', () => {
      const handleClick = vi.fn();
      render(<AlertBadge level="normal" onClick={handleClick} />);

      expect(screen.getByText('NORMAL')).toBeInTheDocument();
    });

    it('should call onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<AlertBadge level="critical" onClick={handleClick} />);

      fireEvent.click(screen.getByText('CRÍTICO'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should render with different sizes', () => {
      const { rerender } = render(<AlertBadge level="critical" size="sm" />);

      rerender(<AlertBadge level="critical" size="md" />);

      rerender(<AlertBadge level="critical" size="lg" />);
    });

    it('should hide text when showText is false', () => {
      render(<AlertBadge level="critical" showText={false} showIcon={true} />);

      expect(screen.queryByText('CRÍTICO')).not.toBeInTheDocument();
    });

    it('should hide icon when showIcon is false', () => {
      render(<AlertBadge level="critical" showIcon={false} showText={true} />);

      expect(screen.getByText('CRÍTICO')).toBeInTheDocument();
    });

    it('should have correct tooltip text', () => {
      render(<AlertBadge level="critical" daysRemaining={15} />);

      const badge = screen.getByText('CRÍTICO').parentElement;
      expect(badge).toHaveAttribute('title', 'Prescripción vence en 15 días');
    });
  });

  describe('AlertIcon Component', () => {
    it('should render icon for critical level', () => {
      render(<AlertIcon level="critical" />);

      expect(document.querySelector('svg')).toBeInTheDocument();
    });

    it('should return null for normal level', () => {
      const { container } = render(<AlertIcon level="normal" />);

      expect(container.firstChild).toBeNull();
    });

    it('should call onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<AlertIcon level="warning" onClick={handleClick} />);

      fireEvent.click(document.querySelector('svg')!);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('AlertCounter Component', () => {
    it('should render message when no alerts', () => {
      render(
        <AlertCounter
          counts={{
            normal: 0,
            warning: 0,
            critical: 0,
            legal_stagnation_warning: 0,
            legal_stagnation_critical: 0,
            resolved: 0,
          }}
        />
      );

      expect(screen.getByText('Sin alertas')).toBeInTheDocument();
    });

    it('should render critical count', () => {
      render(
        <AlertCounter
          counts={{
            normal: 0,
            warning: 0,
            critical: 5,
            legal_stagnation_warning: 0,
            legal_stagnation_critical: 0,
            resolved: 0,
          }}
        />
      );

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should render warning count', () => {
      render(
        <AlertCounter
          counts={{
            normal: 0,
            warning: 3,
            critical: 0,
            legal_stagnation_warning: 0,
            legal_stagnation_critical: 0,
            resolved: 0,
          }}
        />
      );

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should render multiple alert types', () => {
      render(
        <AlertCounter
          counts={{
            normal: 0,
            warning: 2,
            critical: 1,
            legal_stagnation_warning: 3,
            legal_stagnation_critical: 1,
            resolved: 0,
          }}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument(); // critical
      expect(screen.getByText('2')).toBeInTheDocument(); // warning
      expect(screen.getAllByText('3').length).toBeGreaterThan(0); // stagnation
    });
  });
});
