import { createClient } from '@supabase/supabase-js';
import { addDays } from 'date-fns';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Extract date from ultimo_seguimiento_raw text
 * Format: "Fecha: DD/MM/YYYY - ..."
 */
function extractDateFromRaw(raw: string): Date | null {
  if (!raw || raw === 'EMPTY' || raw.trim() === '') {
    return null;
  }

  // Match pattern: "Fecha: DD/MM/YYYY"
  const match = raw.match(/Fecha:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/);

  if (match) {
    const [, day, month, year] = match;
    try {
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch (e) {
      console.warn(`Failed to parse date from: ${raw}`);
    }
  }

  return null;
}

/**
 * Calculate next follow-up date based on estado_softseguros
 */
function calculateNextFollowUp(lastDate: Date, estadoSoftseguros: string): Date | null {
  const estado = estadoSoftseguros.toLowerCase();

  // Proceso jurídico o prescripción: 30 días
  if (estado.includes('proceso juridico') || estado.includes('prescripcion')) {
    return addDays(lastDate, 30);
  }

  // Pagado, finalizado: no necesita seguimiento
  if (estado.includes('pagado') || estado.includes('finalizado')) {
    return null;
  }

  // Fases estándar: 10 días
  return addDays(lastDate, 10);
}

async function processFollowUpDates() {
  console.log('🚀 Processing follow-up dates...\n');

  try {
    // Step 1: Add fecha_ultimo_seguimiento column if not exists
    console.log('Step 1: Adding columns if needed...');
    try {
      await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE claims ADD COLUMN IF NOT EXISTS fecha_ultimo_seguimiento DATE;`,
      });
    } catch (e) {
      // Column might already exist
    }

    // Step 2: Fetch all claims with ultimo_seguimiento_raw
    console.log('Step 2: Fetching claims...');
    const { data: claims, error: fetchError } = await supabase
      .from('claims')
      .select('id_softseguros, ultimo_seguimiento_raw, estado_softseguros')
      .not('ultimo_seguimiento_raw', 'is', null)
      .neq('ultimo_seguimiento_raw', 'EMPTY');

    if (fetchError) {
      throw new Error(`Failed to fetch claims: ${fetchError.message}`);
    }

    console.log(`Found ${claims?.length || 0} claims to process\n`);

    if (!claims || claims.length === 0) {
      console.log('No claims to process');
      return;
    }

    // Step 3: Process in batches
    const batchSize = 50;
    let processed = 0;
    let updated = 0;
    let errors = 0;

    console.log('Step 3: Processing claims...\n');

    for (let i = 0; i < claims.length; i += batchSize) {
      const batch = claims.slice(i, i + batchSize);

      for (const claim of batch) {
        try {
          const lastDate = extractDateFromRaw(claim.ultimo_seguimiento_raw);

          if (lastDate) {
            const nextDate = calculateNextFollowUp(lastDate, claim.estado_softseguros || '');

            // Update claim
            const { error: updateError } = await supabase
              .from('claims')
              .update({
                fecha_ultimo_seguimiento: lastDate.toISOString().split('T')[0],
                proximo_seguimiento: nextDate ? nextDate.toISOString() : null,
              })
              .eq('id_softseguros', claim.id_softseguros);

            if (updateError) {
              console.warn(`Failed to update ${claim.id_softseguros}:`, updateError.message);
              errors++;
            } else {
              updated++;
            }
          }

          processed++;
        } catch (error) {
          console.warn(`Error processing ${claim.id_softseguros}:`, (error as Error).message);
          errors++;
          processed++;
        }
      }

      if (processed % 50 === 0) {
        console.log(
          `Progress: ${processed}/${claims.length} (${Math.round((processed / claims.length) * 100)}%)`
        );
      }
    }

    console.log('\n✅ Processing complete!\n');
    console.log('📊 Summary:');
    console.log(`  Total processed: ${processed}`);
    console.log(`  Updated with dates: ${updated}`);
    console.log(`  Errors: ${errors}`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

processFollowUpDates();
