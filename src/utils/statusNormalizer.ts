import { InternalState } from '../types';

/**
 * Normalizes the `estado_softseguros` string to derive the most specific internal state.
 * Expected format from SoftSeguros often is compound, e.g., "Siniestro Cerrado - Desistimiento".
 * 
 * This function follows the specified normalization rule:
 * - split the string by the hyphen ("-") delimiter
 * - extract the last element
 * - trim whitespace
 * - convert to uppercase to match InternalState
 */
export const normalizeEstado = (estadoSoftSeguros: string | null | undefined): InternalState => {
  if (!estadoSoftSeguros) return 'AVISO SINIESTRO' as InternalState;
  
  const cleanState = estadoSoftSeguros.trim();
  const parts = cleanState.split('-');
  let lastPart = parts[parts.length - 1].trim().toUpperCase();
  
  // Remove numbering like "5. ", "3C. ", "1. \t"
  lastPart = lastPart.replace(/^\d+[A-Z]?\.\s*/, '').trim();
  
  return lastPart as InternalState;
};
