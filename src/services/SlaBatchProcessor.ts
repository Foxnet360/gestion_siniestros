import { createClient } from '@supabase/supabase-js';
import { SlaTrackingService } from './SlaTrackingService';

/**
 * Batch processing job for SLA stage extraction
 * Can be run as a cron job or triggered manually
 */
export class SlaBatchProcessor {
  private supabase;
  private slaService;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.slaService = new SlaTrackingService();
  }

  /**
   * Process all unprocessed claims
   */
  async processAll(batchSize: number = 100): Promise<{
    totalProcessed: number;
    successful: number;
    failed: number;
    extractedByStage: { [key: number]: number };
    errors: { claimId: string; error: string }[];
  }> {
    console.log('🚀 Starting batch processing...\n');

    const summary = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      extractedByStage: {} as { [key: number]: number },
      errors: [] as { claimId: string; error: string }[],
    };

    // Initialize counters
    for (let i = 1; i <= 16; i++) {
      summary.extractedByStage[i] = 0;
    }

    try {
      // Get all claims without stage data
      const { data: claims, error } = await this.supabase
        .from('claims')
        .select('id_softseguros')
        .not('id_softseguros', 'in', this.supabase.from('siniestro_etapas').select('claim_id'));

      if (error) {
        throw new Error(`Failed to fetch claims: ${error.message}`);
      }

      if (!claims || claims.length === 0) {
        console.log('✅ No claims to process');
        return summary;
      }

      console.log(`📊 Processing ${claims.length} claims\n`);

      // Process in batches
      for (let i = 0; i < claims.length; i += batchSize) {
        const batch = claims.slice(i, i + batchSize);

        for (const claim of batch) {
          try {
            const result = await this.slaService.processClaim(claim.id_softseguros);
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

        // Progress log
        console.log(`📈 Progress: ${Math.min(i + batchSize, claims.length)}/${claims.length}`);
      }

      console.log('\n✅ Batch processing completed!\n');
      this.logSummary(summary);

      return summary;
    } catch (error) {
      console.error('❌ Batch processing failed:', error);
      throw error;
    }
  }

  /**
   * Process a specific claim by ID
   */
  async processClaim(claimId: string): Promise<{
    success: boolean;
    extractedDates: number;
    errors: string[];
  }> {
    try {
      const result = await this.slaService.processClaim(claimId);

      const extractedDates = Object.values(result.extractedDates).filter(d => d !== null).length;

      return {
        success: result.success,
        extractedDates,
        errors: result.errors,
      };
    } catch (error) {
      return {
        success: false,
        extractedDates: 0,
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * Re-process a claim (force update)
   */
  async reprocessClaim(claimId: string): Promise<{
    success: boolean;
    extractedDates: number;
    errors: string[];
  }> {
    try {
      // Delete existing stage data
      await this.supabase.from('siniestro_etapas').delete().eq('claim_id', claimId);

      // Re-extract
      return await this.processClaim(claimId);
    } catch (error) {
      return {
        success: false,
        extractedDates: 0,
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * Generate extraction report
   */
  async generateReport(): Promise<{
    totalClaims: number;
    claimsWithStages: number;
    coverageByStage: { [key: number]: number };
  }> {
    const { data: allClaims } = await this.supabase.from('claims').select('id_softseguros');

    const { data: claimsWithStages } = await this.supabase.from('siniestro_etapas').select('*');

    const totalClaims = allClaims?.length || 0;
    const claimsWithStagesCount = claimsWithStages?.length || 0;

    const coverageByStage: { [key: number]: number } = {};
    for (let i = 1; i <= 16; i++) {
      const fieldName = `etapa_${i}_fecha`;
      const count = claimsWithStages?.filter(c => c[fieldName] !== null).length || 0;
      coverageByStage[i] = totalClaims > 0 ? Math.round((count / totalClaims) * 100) : 0;
    }

    return {
      totalClaims,
      claimsWithStages: claimsWithStagesCount,
      coverageByStage,
    };
  }

  /**
   * Log processing summary
   */
  private logSummary(summary: {
    totalProcessed: number;
    successful: number;
    failed: number;
    extractedByStage: { [key: number]: number };
    errors: { claimId: string; error: string }[];
  }): void {
    console.log('📊 Summary:');
    console.log(`  Total processed: ${summary.totalProcessed}`);
    console.log(`  Successful: ${summary.successful}`);
    console.log(`  Failed: ${summary.failed}`);
    console.log(
      `  Success rate: ${Math.round((summary.successful / summary.totalProcessed) * 100)}%\n`
    );

    console.log('📈 Extracted dates by stage:');
    for (let i = 1; i <= 16; i++) {
      const percentage =
        summary.totalProcessed > 0
          ? Math.round((summary.extractedByStage[i] / summary.totalProcessed) * 100)
          : 0;
      console.log(`  Stage ${i}: ${summary.extractedByStage[i]} (${percentage}%)`);
    }

    if (summary.errors.length > 0) {
      console.log(`\n⚠️  Errors: ${summary.errors.length}`);
    }
  }
}

// CLI usage
if (require.main === module) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables');
    process.exit(1);
  }

  const processor = new SlaBatchProcessor(supabaseUrl, supabaseKey);

  processor.processAll().catch(console.error);
}
