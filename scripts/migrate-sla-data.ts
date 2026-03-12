import { createClient } from '@supabase/supabase-js';
import { SlaTrackingService } from '../src/services/SlaTrackingService';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables: VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const slaService = new SlaTrackingService();

/**
 * Migration script to extract stage dates from historical observations
 */
async function migrateHistoricalData() {
  console.log('🚀 Starting historical data migration...\n');

  try {
    // Get count of claims without stage data
    const { data: claimsWithoutStages, error: countError } = await supabase
      .from('claims')
      .select('id_softseguros')
      .not('id_softseguros', 'in', supabase.from('siniestro_etapas').select('claim_id'));

    if (countError) {
      throw new Error(`Failed to count claims: ${countError.message}`);
    }

    const totalClaims = claimsWithoutStages?.length || 0;
    console.log(`📊 Found ${totalClaims} claims without stage data\n`);

    if (totalClaims === 0) {
      console.log('✅ No claims to process. Migration complete!');
      return;
    }

    // Process in batches
    const batchSize = 100;
    let processed = 0;
    let successful = 0;
    let failed = 0;
    const extractedByStage: { [key: number]: number } = {};
    const errors: { claimId: string; error: string }[] = [];

    // Initialize counters
    for (let i = 1; i <= 16; i++) {
      extractedByStage[i] = 0;
    }

    console.log('⏳ Processing claims in batches...\n');

    for (let i = 0; i < totalClaims; i += batchSize) {
      const batch = claimsWithoutStages.slice(i, i + batchSize);

      for (const claim of batch) {
        try {
          const result = await slaService.processClaim(claim.id_softseguros);
          processed++;

          if (result.success) {
            successful++;
          } else if (result.errors.length > 0) {
            failed++;
            errors.push({
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
                extractedByStage[stageNum]++;
              }
            }
          });

          // Progress indicator
          if (processed % 10 === 0) {
            process.stdout.write(
              `\r📈 Progress: ${processed}/${totalClaims} (${Math.round((processed / totalClaims) * 100)}%)`
            );
          }
        } catch (error) {
          processed++;
          failed++;
          errors.push({
            claimId: claim.id_softseguros,
            error: (error as Error).message,
          });
        }
      }
    }

    console.log('\n\n✅ Migration completed!\n');
    console.log('📊 Summary:');
    console.log(`  Total processed: ${processed}`);
    console.log(`  Successful: ${successful}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Success rate: ${Math.round((successful / processed) * 100)}%\n`);

    console.log('📈 Extracted dates by stage:');
    for (let i = 1; i <= 16; i++) {
      const percentage = processed > 0 ? Math.round((extractedByStage[i] / processed) * 100) : 0;
      console.log(`  Stage ${i}: ${extractedByStage[i]} (${percentage}%)`);
    }

    if (errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      console.log(`  Total errors: ${errors.length}`);

      // Show first 5 errors
      errors.slice(0, 5).forEach(({ claimId, error }) => {
        console.log(`  - ${claimId}: ${error}`);
      });

      if (errors.length > 5) {
        console.log(`  ... and ${errors.length - 5} more`);
      }

      // Save errors to file
      const fs = await import('fs');
      const errorLog = errors.map(e => `${e.claimId}: ${e.error}`).join('\n');
      fs.writeFileSync('migration-errors.log', errorLog);
      console.log('\n📝 Full error log saved to migration-errors.log');
    }

    console.log('\n🎉 Migration finished successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateHistoricalData();
