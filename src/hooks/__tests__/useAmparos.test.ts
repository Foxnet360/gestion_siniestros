import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAmparos } from '../useAmparos';

describe('useAmparos', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useAmparos());

    expect(result.current.amparos).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should have required methods', () => {
    const { result } = renderHook(() => useAmparos());

    expect(typeof result.current.addAmparo).toBe('function');
    expect(typeof result.current.updateAmparo).toBe('function');
    expect(typeof result.current.deleteAmparo).toBe('function');
    expect(typeof result.current.refetch).toBe('function');
  });
});
