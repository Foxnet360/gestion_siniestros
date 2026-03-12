import { supabase } from '../lib/supabase';
import type {
  SiniestroEtapas,
  ExtractedDates,
  StageKeywords,
  ExtractionResult,
  BatchExtractionSummary,
} from '../types/sla-kpi';

/**
 * Service for extracting and managing stage dates from claim observations
 */
export class SlaTrackingService {
  // Keywords for stages 3-16 (case-insensitive search)
  private static readonly STAGE_KEYWORDS: StageKeywords = {
    3: ['AJUSTADOR'],
    4: ['DOCUMENTOS ADICIONALES'],
    5: ['ASISTENCIA'],
    6: ['LIQUIDACIÓN', 'LIQUIDACION'],
    7: ['OBJECIÓN', 'OBJECION'],
    8: ['RECONSIDERACIÓN LIQUIDACIÓN', 'RECONSIDERACION LIQUIDACION'],
    9: ['RECONSIDERACIÓN OBJECIÓN', 'RECONSIDERACION OBJECION'],
    10: ['DESISTIMIENTO'],
    11: ['RATIFICACIÓN LIQUIDACIÓN', 'RATIFICACION LIQUIDACION'],
    12: ['RATIFICACIÓN OBJECIÓN', 'RATIFICACION OBJECION'],
    13: ['PRESCRIPCIÓN', 'PRESCRIPCION'],
    14: ['PROCESO JURÍDICO', 'PROCESO JURIDICO'],
    15: ['FINALIZADO'],
    16: ['PAGADO'],
  };

  /**
   * Extract stage dates from a single claim
   */
  async extract(claimId: string): Promise<ExtractionResult> {
    try {
      // Fetch claim data including observations and system dates
      const { data: claim, error } = await supabase
        .from('claims')
        .select(
          'id_softseguros, fecha_aviso, fecha_notificacion_aseguradora, observaciones, fecha_siniestro'
        )
        .eq('id_softseguros', claimId)
        .single();

      if (error || !claim) {
        throw new Error(`Claim not found: ${claimId}`);
      }

      const extractedDates: ExtractedDates = {
        etapa_1_fecha: null,
        etapa_2_fecha: null,
        etapa_3_fecha: null,
        etapa_4_fecha: null,
        etapa_5_fecha: null,
        etapa_6_fecha: null,
        etapa_7_fecha: null,
        etapa_8_fecha: null,
        etapa_9_fecha: null,
        etapa_10_fecha: null,
        etapa_11_fecha: null,
        etapa_12_fecha: null,
        etapa_13_fecha: null,
        etapa_14_fecha: null,
        etapa_15_fecha: null,
        etapa_16_fecha: null,
      };

      const errors: string[] = [];

      // Extract stages 1-2 from system fields
      if (claim.fecha_aviso) {
        const date = this.parseDate(claim.fecha_aviso);
        if (date && this.validateDate(date, claim.fecha_siniestro)) {
          extractedDates.etapa_1_fecha = date;
        } else if (date) {
          errors.push(`Stage 1: Date ${date} failed validation`);
        }
      }

      if (claim.fecha_notificacion_aseguradora) {
        const date = this.parseDate(claim.fecha_notificacion_aseguradora);
        if (date && this.validateDate(date, claim.fecha_siniestro)) {
          extractedDates.etapa_2_fecha = date;
        } else if (date) {
          errors.push(`Stage 2: Date ${date} failed validation`);
        }
      }

      // Extract stages 3-16 from observations
      if (claim.observaciones) {
        const observationText = String(claim.observaciones).toUpperCase();

        for (let stage = 3; stage <= 16; stage++) {
          try {
            const keywords = SlaTrackingService.STAGE_KEYWORDS[stage];
            const date = this.extractDateFromObservation(observationText, keywords);

            if (date) {
              const stageKey = `etapa_${stage}_fecha` as keyof ExtractedDates;
              if (this.validateDate(date, claim.fecha_siniestro)) {
                extractedDates[stageKey] = date;
              } else {
                errors.push(`Stage ${stage}: Date ${date} failed validation`);
              }
            }
          } catch (err) {
            errors.push(`Stage ${stage}: ${(err as Error).message}`);
          }
        }
      }

      return {
        claimId,
        extractedDates,
        errors,
        success: errors.length === 0,
      };
    } catch (error) {
      return {
        claimId,
        extractedDates: this.getEmptyDates(),
        errors: [(error as Error).message],
        success: false,
      };
    }
  }

  /**
   * Extract date from observation text based on keywords
   */
  private extractDateFromObservation(text: string, keywords: string[]): string | null {
    for (const keyword of keywords) {
      // Look for keyword followed by date patterns
      const patterns = [
        new RegExp(`${keyword}[:\\s-]*(\\d{1,2})[\\/](\\d{1,2})[\\/](\\d{2,4})`, 'i'),
        new RegExp(`${keyword}[:\\s-]*(\\d{4})[\\/-](\\d{1,2})[\\/-](\\d{1,2})`, 'i'),
        new RegExp(`${keyword}[:\\s-]*(\\d{1,2})[-.](\\d{1,2})[-.](\\d{2,4})`, 'i'),
      ];

      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          const date = this.normalizeDate(match[0], match[1], match[2], match[3]);
          if (date) return date;
        }
      }
    }
    return null;
  }

  /**
   * Normalize date from various formats to YYYY-MM-DD
   */
  private normalizeDate(
    fullMatch: string,
    part1: string,
    part2: string,
    part3: string
  ): string | null {
    try {
      // Try to detect format (DD/MM/YYYY or YYYY-MM-DD)
      let day: number, month: number, year: number;

      if (part1.length === 4) {
        // YYYY-MM-DD format
        year = parseInt(part1);
        month = parseInt(part2);
        day = parseInt(part3);
      } else {
        // DD/MM/YYYY or DD-MM-YYYY format
        day = parseInt(part1);
        month = parseInt(part2);
        year = parseInt(part3);

        // Handle 2-digit years
        if (year < 100) {
          year += year < 50 ? 2000 : 1900;
        }
      }

      // Validate date components
      if (month < 1 || month > 12 || day < 1 || day > 31) {
        return null;
      }

      const date = new Date(year, month - 1, day);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return null;
      }

      return date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  }

  /**
   * Parse date from various input formats
   */
  private parseDate(dateInput: string | Date): string | null {
    try {
      if (dateInput instanceof Date) {
        return dateInput.toISOString().split('T')[0];
      }

      const date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  }

  /**
   * Validate extracted date
   */
  private validateDate(dateStr: string, claimStartDate?: string | Date): boolean {
    try {
      const date = new Date(dateStr);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      // Check if date is in the future
      if (date > today) {
        return false;
      }

      // Check if date is before claim start date
      if (claimStartDate) {
        const startDate = new Date(claimStartDate);
        if (date < startDate) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get empty dates object
   */
  private getEmptyDates(): ExtractedDates {
    return {
      etapa_1_fecha: null,
      etapa_2_fecha: null,
      etapa_3_fecha: null,
      etapa_4_fecha: null,
      etapa_5_fecha: null,
      etapa_6_fecha: null,
      etapa_7_fecha: null,
      etapa_8_fecha: null,
      etapa_9_fecha: null,
      etapa_10_fecha: null,
      etapa_11_fecha: null,
      etapa_12_fecha: null,
      etapa_13_fecha: null,
      etapa_14_fecha: null,
      etapa_15_fecha: null,
      etapa_16_fecha: null,
    };
  }

  /**
   * Update or create stage dates for a claim
   */
  async updateStages(claimId: string, dates: ExtractedDates): Promise<void> {
    const { error } = await supabase.from('siniestro_etapas').upsert(
      {
        claim_id: claimId,
        ...dates,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'claim_id',
      }
    );

    if (error) {
      throw new Error(`Failed to update stages for claim ${claimId}: ${error.message}`);
    }
  }

  /**
   * Process a single claim and update its stages
   */
  async processClaim(claimId: string): Promise<ExtractionResult> {
    const result = await this.extract(claimId);

    if (result.success || Object.values(result.extractedDates).some(d => d !== null)) {
      await this.updateStages(claimId, result.extractedDates);
    }

    return result;
  }

  /**
   * Batch process all claims without stage data
   */
  async batchProcess(batchSize: number = 100): Promise<BatchExtractionSummary> {
    const summary: BatchExtractionSummary = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      extractedByStage: {},
      errors: [],
    };

    // Initialize counters for each stage
    for (let i = 1; i <= 16; i++) {
      summary.extractedByStage[i] = 0;
    }

    try {
      // Get all claims without stage data
      const { data: claims, error } = await supabase
        .from('claims')
        .select('id_softseguros')
        .not('id_softseguros', 'in', supabase.from('siniestro_etapas').select('claim_id'));

      if (error) {
        throw new Error(`Failed to fetch claims: ${error.message}`);
      }

      if (!claims || claims.length === 0) {
        return summary;
      }

      // Process in batches
      for (let i = 0; i < claims.length; i += batchSize) {
        const batch = claims.slice(i, i + batchSize);

        for (const claim of batch) {
          try {
            const result = await this.processClaim(claim.id_softseguros);
            summary.totalProcessed++;

            if (result.success) {
              summary.successful++;
            } else if (result.errors.length > 0) {
              summary.failed++;
              summary.errors.push({
                claimId: claim.id_softseguros,
                error: result.errors.join('; '),
              });
            }

            // Count extracted dates by stage
            Object.entries(result.extractedDates).forEach(([key, date]) => {
              if (date) {
                const stageMatch = key.match(/etapa_(\d+)_fecha/);
                if (stageMatch) {
                  const stageNum = parseInt(stageMatch[1]);
                  summary.extractedByStage[stageNum]++;
                }
              }
            });
          } catch (error) {
            summary.totalProcessed++;
            summary.failed++;
            summary.errors.push({
              claimId: claim.id_softseguros,
              error: (error as Error).message,
            });
          }
        }
      }

      return summary;
    } catch (error) {
      throw new Error(`Batch processing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Log unparseable observation
   */
  async logUnparseableObservation(
    claimId: string,
    observation: string,
    reason: string
  ): Promise<void> {
    const snippet = observation.substring(0, 200); // First 200 chars
    const errorMsg = `Unparseable: ${reason} | Snippet: ${snippet}`;

    const { data: existing } = await supabase
      .from('siniestro_etapas')
      .select('extraction_errors')
      .eq('claim_id', claimId)
      .single();

    const errors = existing?.extraction_errors || [];
    errors.push(errorMsg);

    await supabase.from('siniestro_etapas').upsert(
      {
        claim_id: claimId,
        extraction_errors: errors,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'claim_id',
      }
    );
  }
}

// Export singleton instance
export const slaTrackingService = new SlaTrackingService();
