import { InternalState } from '../types';

/**
 * Reglas de validación de texto a etapa
 * Cada regla define patrones de texto que deberían corresponder a una etapa específica
 */
interface ValidationRule {
  patterns: string[];
  expectedStage: InternalState;
  description: string;
}

/**
 * Reglas configurables para validar si el texto de una novedad
 * corresponde lógicamente con la etapa reportada
 */
export const TEXT_TO_STAGE_RULES: ValidationRule[] = [
  {
    patterns: ['reconsideración', 'reconsideracion', 'reconsiderar'],
    expectedStage: 'RECONSIDERACIÓN LIQUIDACIÓN',
    description:
      'Textos de reconsideración deberían estar en etapa 4 (RECONSIDERACIÓN LIQUIDACIÓN)',
  },
  {
    patterns: ['objeción', 'objecion', 'objetar'],
    expectedStage: 'OBJECIÓN',
    description: 'Textos de objeción deberían estar en etapa de OBJECIÓN',
  },
  {
    patterns: ['liquidación', 'liquidacion', 'liquidar'],
    expectedStage: 'LIQUIDACIÓN',
    description: 'Textos de liquidación deberían estar en etapa de LIQUIDACIÓN',
  },
  {
    patterns: ['pago', 'pagado', 'indemnización', 'indemnizacion'],
    expectedStage: 'PAGADO',
    description: 'Textos de pago deberían estar en etapa PAGADO',
  },
  {
    patterns: ['ajustador', 'ajuste'],
    expectedStage: 'AJUSTADOR',
    description: 'Textos de ajustador deberían estar en etapa AJUSTADOR',
  },
  {
    patterns: ['radicación', 'radicacion', 'radicar', 'compañía'],
    expectedStage: 'RADICACIÓN COMPAÑÍA',
    description: 'Textos de radicación deberían estar en etapa RADICACIÓN COMPAÑÍA',
  },
];

/**
 * Valida si el texto de una novedad corresponde con la etapa actual
 * @param text - Texto de la novedad
 * @param currentStage - Etapa actual del siniestro
 * @returns Resultado de la validación
 */
export interface ValidationResult {
  isValid: boolean;
  mismatches: Array<{
    pattern: string;
    expectedStage: InternalState;
    description: string;
  }>;
}

export const validateTextToStage = (
  text: string | undefined | null,
  currentStage: InternalState
): ValidationResult => {
  if (!text) {
    return { isValid: true, mismatches: [] };
  }

  const lowerText = text.toLowerCase();
  const mismatches: Array<{
    pattern: string;
    expectedStage: InternalState;
    description: string;
  }> = [];

  for (const rule of TEXT_TO_STAGE_RULES) {
    // Si el texto contiene alguno de los patrones
    const hasPattern = rule.patterns.some(pattern => lowerText.includes(pattern.toLowerCase()));

    // Y la etapa actual NO es la esperada
    if (hasPattern && currentStage !== rule.expectedStage) {
      mismatches.push({
        pattern: rule.patterns[0],
        expectedStage: rule.expectedStage,
        description: rule.description,
      });
    }
  }

  return {
    isValid: mismatches.length === 0,
    mismatches,
  };
};
